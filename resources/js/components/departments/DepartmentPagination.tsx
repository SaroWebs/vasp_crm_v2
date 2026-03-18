import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DepartmentPaginationProps {
    currentPage: number;
    lastPage: number;
    totalDepartments: number;
    filters: {
        per_page: number;
    };
    onPageChange: (page: number) => void;
}

export default function DepartmentPagination({
    currentPage,
    lastPage,
    totalDepartments,
    filters,
    onPageChange
}: DepartmentPaginationProps) {
    if (lastPage <= 1) return null;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * filters.per_page) + 1} to {Math.min(currentPage * filters.per_page, totalDepartments)} of {totalDepartments} departments
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                            Page {currentPage} of {lastPage}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= lastPage}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}