import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, Play } from 'lucide-react';

interface OverdueWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnyway: () => void;
  onExtendAndStart: (newDueDate: string) => void;
  overdueDays: number;
  currentDueDate: string;
  isLoading?: boolean;
}

export function OverdueWarningDialog({
  isOpen,
  onClose,
  onStartAnyway,
  onExtendAndStart,
  overdueDays,
  currentDueDate,
  isLoading = false,
}: OverdueWarningDialogProps) {
  const [newDueDate, setNewDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleExtendAndStart = () => {
    if (newDueDate) {
      onExtendAndStart(newDueDate);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Due Date Overdue
          </DialogTitle>
          <DialogDescription className="pt-2">
            This task is overdue by{' '}
            <span className="font-semibold text-amber-600">
              {overdueDays} {overdueDays === 1 ? 'day' : 'days'}
            </span>
            . The original due date was: {formatDate(currentDueDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!showDatePicker ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You can either start the task anyway or extend the due date first.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(true)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Extend Due Date
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDueDate">New Due Date</Label>
                <Input
                  id="newDueDate"
                  type="datetime-local"
                  min={getMinDate()}
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Select a new due date in the future
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleExtendAndStart}
                  className="flex-1"
                  disabled={!newDueDate || isLoading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Extend & Start
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onStartAnyway}
            variant="default"
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
