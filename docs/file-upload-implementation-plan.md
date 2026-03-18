# File/Image Upload Implementation Plan for Ticket Comments

## Current System Analysis

### Existing Structure
- **Database**: MySQL with Laravel migrations
- **Storage**: Public disk using `storage/app/public` with symbolic link to `public/storage`
- **Authentication**: Multi-guard system (web, admin, client)
- **Frontend**: React with TypeScript, Inertia.js
- **Real-time**: Laravel Echo for broadcasting events

### Existing Attachment Pattern
- **TicketAttachments**: Separate table for ticket-level attachments
- **Storage**: Files stored in `ticket-files` directory using public disk
- **Model**: Simple model with ticket_id, file_path, file_type, uploaded_by_type, uploaded_by

## Implementation Plan

### 1. Database Migration for Comment Attachments

**File**: `database/migrations/[timestamp]_create_comment_attachments_table.php`

```php
Schema::create('comment_attachments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('comment_id')->constrained('ticket_comments')->onDelete('cascade');
    $table->string('file_path');
    $table->string('file_type');
    $table->string('original_filename');
    $table->unsignedBigInteger('file_size');
    $table->enum('uploaded_by_type', ['user', 'client'])->default('user');
    $table->unsignedBigInteger('uploaded_by')->nullable();
    $table->timestamps();
});
```

### 2. CommentAttachment Model

**File**: `app/Models/CommentAttachment.php`

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommentAttachment extends Model
{
    protected $fillable = [
        'comment_id',
        'file_path',
        'file_type',
        'original_filename',
        'file_size',
        'uploaded_by_type',
        'uploaded_by',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class);
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->file_type, 'image/');
    }
}
```

### 3. Update TicketComment Model

**File**: `app/Models/TicketComment.php`

Add relationship method:
```php
public function attachments(): HasMany
{
    return $this->hasMany(CommentAttachment::class);
}
```

Update fillable array:
```php
protected $fillable = [
    'ticket_id',
    'comment_text',
    'commented_by_type',
    'commented_by',
    'is_internal',
];
```

### 4. Update TicketCommentController

**File**: `app/Http/Controllers/TicketCommentController.php`

#### Store Method Updates:
- Add file validation
- Handle file uploads
- Create attachments after comment creation

```php
$validated = $request->validate([
    'comment_text' => 'required|string|max:5000',
    'is_internal' => 'boolean',
    'attachments' => 'nullable|array',
    'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt',
]);

// ... existing comment creation code ...

// Handle file uploads
if ($request->hasFile('attachments')) {
    foreach ($request->file('attachments') as $file) {
        $this->storeCommentAttachment($comment, $file, $request);
    }
}
```

#### Add Helper Method:
```php
protected function storeCommentAttachment(TicketComment $comment, $file, Request $request): CommentAttachment
{
    $path = $file->store('comment-files/' . $comment->ticket_id, 'public');

    return CommentAttachment::create([
        'comment_id' => $comment->id,
        'file_path' => $path,
        'file_type' => $file->getClientMimeType(),
        'original_filename' => $file->getClientOriginalName(),
        'file_size' => $file->getSize(),
        'uploaded_by_type' => $commentedByType,
        'uploaded_by' => $commentedBy,
    ]);
}
```

#### Update Response Data:
Include attachments in the response:
```php
$commentData = [
    // ... existing fields ...
    'attachments' => $comment->attachments()->get()->map(function ($attachment) {
        return [
            'id' => $attachment->id,
            'file_url' => $attachment->file_url,
            'file_type' => $attachment->file_type,
            'original_filename' => $attachment->original_filename,
            'file_size' => $attachment->file_size,
            'is_image' => $attachment->is_image,
            'created_at' => $attachment->created_at,
        ];
    }),
];
```

### 5. Create CommentAttachmentController

**File**: `app/Http/Controllers/CommentAttachmentController.php`

```php
namespace App\Http\Controllers;

use App\Models\TicketComment;
use App\Models\CommentAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CommentAttachmentController extends Controller
{
    public function destroy(TicketComment $comment, CommentAttachment $attachment)
    {
        // Authorization check
        $canDelete = false;
        if (Auth::guard('web')->check() && $comment->commented_by_type === 'user' && $comment->commented_by === Auth::guard('web')->id()) {
            $canDelete = true;
        } elseif (Auth::guard('admin')->check()) {
            $canDelete = true; // Admins can delete any attachment
        } elseif (Auth::guard('client')->check() && $comment->commented_by_type === 'client' && $comment->commented_by === Auth::guard('client')->id()) {
            $canDelete = true;
        }

        if (!$canDelete) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to delete this attachment',
            ], 403);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        // Delete database record
        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attachment deleted successfully',
        ]);
    }
}
```

### 6. Update Frontend Component

**File**: `resources/js/components/ticket-comments.tsx`

#### Add File Upload UI:
```tsx
// Add to imports
import { Paperclip, X } from 'lucide-react';

// Add to component state
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// Add file input handler
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setSelectedFiles(Array.from(e.target.files));
    }
};

// Add file removal handler
const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
};

// Update form submission
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && selectedFiles.length === 0) || submitting) return;

    try {
        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('comment_text', newComment.trim());
        formData.append('is_internal', 'false');

        selectedFiles.forEach(file => {
            formData.append('attachments[]', file);
        });

        const response = await axios.post(`/admin/tickets/${ticketId}/comments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.success) {
            setComments([...comments, response.data.data]);
            setNewComment('');
            setSelectedFiles([]);
        }
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
        setSubmitting(false);
    }
};
```

#### Update UI Rendering:
Add file upload section to the form:
```tsx
<form onSubmit={handleSubmit} className="p-4 border-t">
    {/* File upload section */}
    {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
    )}

    <div className="flex gap-2">
        <Textarea
            // ... existing textarea props ...
        />

        {/* File input */}
        <label className="cursor-pointer">
            <Paperclip className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
        </label>

        <Button
            // ... existing button props ...
        >
            {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Send className="h-4 w-4" />
            )}
        </Button>
    </div>
</form>
```

### 7. Update SingleComment Component

**File**: `resources/js/components/single-comment.tsx` (need to create/examine)

Add attachment display:
```tsx
{comment.attachments && comment.attachments.length > 0 && (
    <div className="mt-2 flex flex-wrap gap-2">
        {comment.attachments.map((attachment) => (
            <div key={attachment.id} className="group relative">
                {attachment.is_image ? (
                    <img
                        src={attachment.file_url}
                        alt={attachment.original_filename}
                        className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(attachment.file_url, '_blank')}
                    />
                ) : (
                    <div
                        className="h-20 w-20 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200"
                        onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                        <div className="text-center text-xs px-1">
                            <Paperclip className="h-4 w-4 mx-auto mb-1" />
                            <div className="truncate">{attachment.original_filename}</div>
                        </div>
                    </div>
                )}

                {/* Delete button for own attachments */}
                {isOwn && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttachment(attachment.id);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-2 w-2" />
                    </button>
                )}
            </div>
        ))}
    </div>
)}
```

### 8. Update Routes

**File**: `routes/web.php`

Add new routes:
```php
// Comment attachment routes
Route::delete('/tickets/{ticket}/comments/{comment}/attachments/{attachment}', [CommentAttachmentController::class, 'destroy'])
    ->name('comments.attachments.destroy');
```

### 9. File Validation and Security

#### Server-side Validation:
- File size limit: 10MB max
- Allowed file types: images, PDFs, documents, spreadsheets, text
- MIME type verification
- File extension validation

#### Security Measures:
- Store files with random names to prevent directory traversal
- Use public disk with proper permissions
- Implement CSRF protection
- Add rate limiting for uploads
- Scan uploaded files for malware (consider using Laravel antivirus packages)

#### Update .env:
```env
MAX_FILE_UPLOAD_SIZE=10240 # 10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt
```

### 10. Testing Plan

#### Unit Tests:
- Test file upload validation
- Test attachment creation and association
- Test file deletion and cleanup
- Test authorization for attachment operations

#### Integration Tests:
- Test complete comment creation with attachments
- Test real-time broadcasting with attachments
- Test file download and display

#### Manual Testing:
- Test different file types
- Test large file handling
- Test concurrent uploads
- Test mobile responsiveness
- Test error handling and user feedback

## Implementation Timeline

1. **Database Setup** (30 min)
   - Create migration
   - Run migration
   - Create model

2. **Backend Implementation** (2 hours)
   - Update TicketComment model
   - Update TicketCommentController
   - Create CommentAttachmentController
   - Add validation and security

3. **Frontend Implementation** (3 hours)
   - Update ticket-comments.tsx
   - Update single-comment.tsx
   - Add file preview functionality
   - Add error handling

4. **Testing and Debugging** (1 hour)
   - Unit tests
   - Integration tests
   - Manual testing
   - Bug fixes

## Dependencies

- Laravel 10+
- React 18+
- TypeScript 4+
- Inertia.js
- Laravel Echo
- Axios

## Risk Assessment

- **File Storage**: Ensure sufficient disk space for uploads
- **Performance**: Large files may impact response times
- **Security**: Proper validation to prevent malicious uploads
- **Compatibility**: Ensure all file types display correctly

## Success Criteria

- Users can upload files with comments
- Files display properly in the chat interface
- File types are validated and secure
- Attachments can be deleted by authorized users
- Real-time updates work with attachments
- Mobile responsive design
- Proper error handling and user feedback