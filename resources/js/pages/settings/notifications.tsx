import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Switch } from '@/components/ui/switch';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification Settings',
        href: '/settings/notifications',
    },
];

interface Preferences {
    notify_via_pusher: boolean;
    notify_via_whatsapp: boolean;
    notify_via_sms: boolean;
    notify_via_email: boolean;
    whatsapp_number: string | null;
    sms_number: string | null;
}

interface Props {
    preferences: Preferences;
}

export default function NotificationSettings({ preferences }: Props) {
    const [formData, setFormData] = useState<Preferences>({
        notify_via_pusher: preferences.notify_via_pusher,
        notify_via_whatsapp: preferences.notify_via_whatsapp,
        notify_via_sms: preferences.notify_via_sms,
        notify_via_email: preferences.notify_via_email,
        whatsapp_number: preferences.whatsapp_number,
        sms_number: preferences.sms_number,
    });
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.patch('/settings/notifications', formData as any, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Notification Preferences"
                        description="Choose how you want to receive notifications"
                    />

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* In-app Notifications (Pusher) - Always enabled */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="notify_via_pusher">
                                    In-app Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive real-time notifications in the app (always on)
                                </p>
                            </div>
                            <Switch
                                id="notify_via_pusher"
                                checked={formData.notify_via_pusher}
                                onCheckedChange={(checked) => {
                                    setFormData({ ...formData, notify_via_pusher: checked });
                                }}
                                disabled
                            />
                        </div>

                        {/* Email Notifications */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="notify_via_email">
                                    Email Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications via email
                                </p>
                            </div>
                            <Switch
                                id="notify_via_email"
                                checked={formData.notify_via_email}
                                onCheckedChange={(checked) => {
                                    setFormData({ ...formData, notify_via_email: checked });
                                }}
                            />
                        </div>

                        {/* WhatsApp Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="notify_via_whatsapp">
                                        WhatsApp Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications via WhatsApp
                                    </p>
                                </div>
                                <Switch
                                    id="notify_via_whatsapp"
                                    checked={formData.notify_via_whatsapp}
                                    onCheckedChange={(checked) => {
                                        setFormData({ ...formData, notify_via_whatsapp: checked });
                                    }}
                                />
                            </div>

                            {formData.notify_via_whatsapp && (
                                <div className="ml-6 space-y-2">
                                    <Label htmlFor="whatsapp_number">
                                        WhatsApp Phone Number
                                    </Label>
                                    <Input
                                        id="whatsapp_number"
                                        value={formData.whatsapp_number || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, whatsapp_number: e.target.value });
                                        }}
                                        placeholder="9876543210"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter phone number without country code (e.g., 9876543210)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* SMS Notifications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="notify_via_sms">
                                        SMS Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive notifications via SMS
                                    </p>
                                </div>
                                <Switch
                                    id="notify_via_sms"
                                    checked={formData.notify_via_sms}
                                    onCheckedChange={(checked) => {
                                        setFormData({ ...formData, notify_via_sms: checked });
                                    }}
                                />
                            </div>

                            {formData.notify_via_sms && (
                                <div className="ml-6 space-y-2">
                                    <Label htmlFor="sms_number">
                                        SMS Phone Number
                                    </Label>
                                    <Input
                                        id="sms_number"
                                        value={formData.sms_number || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, sms_number: e.target.value });
                                        }}
                                        placeholder="9876543210"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}