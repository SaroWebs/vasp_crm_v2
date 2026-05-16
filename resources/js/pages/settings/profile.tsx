import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import EmployeeOfficeController from '@/actions/App/Http/Controllers/EmployeeOfficeController';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage, router } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import ClientLayout from '@/layouts/client/client-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Building2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

function isEmailUnverified(user: unknown): boolean {
    return (
        typeof user === 'object' &&
        user !== null &&
        'email_verified_at' in user &&
        (user as { email_verified_at: string | null }).email_verified_at === null
    );
}

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const Layout = auth?.guard === 'organization' ? ClientLayout : AppLayout;

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth?.user?.name || ''}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth?.user?.email || ''}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth?.user &&
                                    isEmailUnverified(auth.user) && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href="/email/verification-notification"
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>

                    {auth?.user?.employee?.offices && auth.user.employee.offices.length > 0 && (
                        <div className="space-y-6 pt-6 border-t">
                            <HeadingSmall
                                title="Active Office"
                                description="Select your current active office. This determines where your live punch notifications are sent."
                            />

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {auth.user.employee.offices.map((office: any) => (
                                    <Card 
                                        key={office.id} 
                                        className={`relative overflow-hidden cursor-pointer transition-all hover:border-primary/50 ${office.pivot?.is_active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}
                                        onClick={() => {
                                            if (!office.pivot?.is_active) {
                                                router.patch(EmployeeOfficeController.updateActiveOffice(), {
                                                    office_id: office.id
                                                }, {
                                                    preserveScroll: true
                                                });
                                            }
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${office.pivot?.is_active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{office.name}</p>
                                                        <p className="text-xs text-muted-foreground">{office.whatsapp_number || 'No WhatsApp'}</p>
                                                    </div>
                                                </div>
                                                {office.pivot?.is_active && (
                                                    <Badge variant="default" className="text-[10px] h-5">Active</Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DeleteUser />
            </SettingsLayout>
        </Layout>
    );
}

