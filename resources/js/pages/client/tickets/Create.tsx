import ClientLayout from '@/layouts/client-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ClientTicketCreateProps {
    client: {
        id: number;
        name: string;
        code: string;
    };
}

export default function ClientTicketCreate({ client }: ClientTicketCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'low',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/c/${client.code}/tickets`);
    };

    return (
        <ClientLayout client={client} title="Create Ticket">
            <Head title={`${client.name} • Create Ticket`} />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Create Ticket</h1>
                    <Link href={`/c/${client.code}/tickets`}>
                        <Button variant="outline">Back</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    required
                                />
                                {errors.title ? (
                                    <p className="text-sm text-red-500">
                                        {errors.title}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={6}
                                />
                                {errors.description ? (
                                    <p className="text-sm text-red-500">
                                        {errors.description}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) =>
                                            setData('category', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">
                                                General
                                            </SelectItem>
                                            <SelectItem value="support">
                                                Support
                                            </SelectItem>
                                            <SelectItem value="technical">
                                                Technical
                                            </SelectItem>
                                            <SelectItem value="billing">
                                                Billing
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category ? (
                                        <p className="text-sm text-red-500">
                                            {errors.category}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority *</Label>
                                    <Select
                                        value={data.priority}
                                        onValueChange={(value) =>
                                            setData('priority', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">
                                                Critical
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority ? (
                                        <p className="text-sm text-red-500">
                                            {errors.priority}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Link href={`/c/${client.code}/tickets`}>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </ClientLayout>
    );
}
