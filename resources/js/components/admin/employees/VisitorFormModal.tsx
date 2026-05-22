import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { type Visitor } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VisitorFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    visitor?: Visitor | null;
    onSuccess?: () => void;
}

type VisitorFormData = Partial<Visitor> & { code: number };

export default function VisitorFormModal({
    open,
    onOpenChange,
    visitor,
    onSuccess,
}: VisitorFormModalProps) {
    const { props } = usePage<{ csrf_token: string }>();
    const csrfToken = props.csrf_token;

    const [formData, setFormData] = useState<VisitorFormData>({
        code: 0,
        name: '',
        card_number: '',
        is_active: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    useEffect(() => {
        if (visitor) {
            setFormData(visitor);
        } else {
            setFormData({
                code: 0,
                name: '',
                card_number: '',
                is_active: true,
            });
        }
        setErrors({});
        setGeneralError('');
    }, [visitor, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : (name === 'code' ? parseInt(value) || 0 : value);

        setFormData((prev) => ({
            ...prev,
            [name]: fieldValue,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setGeneralError('');
        setLoading(true);

        try {
            const url = visitor?.id ? `/admin/visitors/${visitor.id}` : '/admin/visitors';
            const method = visitor?.id ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setGeneralError(data.message || 'An error occurred while saving the visitor');
                }
                return;
            }

            onOpenChange(false);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setGeneralError('An unexpected error occurred. Please try again.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const isEditing = !!visitor?.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Card' : 'Add New Card'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the card information below'
                            : 'Enter the card details to create a new visitor card'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {generalError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{generalError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code">Card Code *</Label>
                        <Input
                            id="code"
                            name="code"
                            type="number"
                            placeholder="e.g., 5, 6, 7"
                            value={formData.code || ''}
                            onChange={handleInputChange}
                            required
                            className={errors.code ? 'border-red-500' : ''}
                        />
                        {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Card Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="e.g., Office Visitor Card"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="card_number">Card Number</Label>
                        <Input
                            id="card_number"
                            name="card_number"
                            type="text"
                            placeholder="e.g., CARD-12345"
                            value={formData.card_number || ''}
                            onChange={handleInputChange}
                            className={errors.card_number ? 'border-red-500' : ''}
                        />
                        {errors.card_number && <p className="text-sm text-red-500">{errors.card_number}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    is_active: Boolean(checked),
                                }));
                            }}
                        />
                        <Label htmlFor="is_active" className="font-normal cursor-pointer">
                            Active
                        </Label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Card'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
