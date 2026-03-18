import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users, Shield } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    level: number;
    is_default: boolean;
    permissions: Permission[];
}

interface RoleCardProps {
    role: Role;
    onEditRole: (role?: Role) => void;
}

export default function RoleCard({ role, onEditRole }: RoleCardProps) {
    const handleDeleteRole = () => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(`/admin/roles/${role.id}`);
        }
    };

    return (
        <Card className='relative'>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <span>
                        {role.name}
                    </span>
                    <Badge variant="secondary">Level {role.level}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="pb-8">
                    {role.description || 'No description'}
                </CardDescription>
            </CardContent>
            <CardFooter className='absolute bottom-0 w-full pb-3'>
                <div className="w-full flex items-center justify-between space-x-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-4 w-4" />
                        {role.is_default ? 'Full' : role.permissions.length} permissions
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRole(role)}
                            disabled={role.is_default}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteRole}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
