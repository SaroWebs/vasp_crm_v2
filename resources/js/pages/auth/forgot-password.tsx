// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface ForgotPasswordProps {
    status?: string;
    action?: string;
    loginHref?: string;
    mode?: 'email' | 'whatsapp';
}

export default function ForgotPassword({
    status,
    action = '/forgot-password',
    loginHref = '/login',
    mode = 'email',
}: ForgotPasswordProps) {
    const isWhatsApp = mode === 'whatsapp';

    return (
        <AuthLayout
            title="Forgot password"
            description={
                isWhatsApp
                    ? 'Enter your email or phone number to receive a password reset link on WhatsApp'
                    : 'Enter your email to receive a password reset link'
            }
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form action={action} method="post">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="login">
                                    {isWhatsApp
                                        ? 'Email or phone number'
                                        : 'Email address'}
                                </Label>
                                <Input
                                    id="login"
                                    type={isWhatsApp ? 'text' : 'email'}
                                    name={isWhatsApp ? 'login' : 'email'}
                                    autoComplete="off"
                                    autoFocus
                                    placeholder={
                                        isWhatsApp
                                            ? 'email@example.com or 9876543210'
                                            : 'email@example.com'
                                    }
                                />

                                <InputError
                                    message={
                                        isWhatsApp
                                            ? errors.login
                                            : errors.email
                                    }
                                />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    {isWhatsApp
                                        ? 'Send reset link on WhatsApp'
                                        : 'Email password reset link'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={loginHref}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
