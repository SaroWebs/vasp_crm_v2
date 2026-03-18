import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';

interface DepartmentFiltersProps {
    filters: {
        search: string;
        per_page: number;
    };
    onFilterChange: (key: string, value: string | number) => void;
    onApplyFilters: () => void;
}

export default function DepartmentFilters({
    filters,
    onFilterChange,
    onApplyFilters
}: DepartmentFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search departments..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select
                        value={filters.per_page.toString()}
                        onValueChange={(value) => onFilterChange('per_page', parseInt(value))}
                    >
                        <SelectTrigger className="w-full sm:w-32">
                            <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 per page</SelectItem>
                            <SelectItem value="25">25 per page</SelectItem>
                            <SelectItem value="50">50 per page</SelectItem>
                            <SelectItem value="100">100 per page</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={onApplyFilters} variant="outline">
                        <Search className="mr-2 h-4 w-4" />
                        Apply
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}