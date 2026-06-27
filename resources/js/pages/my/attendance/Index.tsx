import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type Auth, type BreadcrumbItem } from '@/types';
import {
    PunchWidget,
    AttendanceCalendar,
    TodayAttendanceStatus,
    LeaveBalanceDisplay,
    LeaveHistoryList,
    LeaveRequestForm,
    RemoteWorkHistoryList,
    RemoteWorkRequestForm,
    FieldWorkHistoryList,
    FieldWorkRequestForm,
} from '@/components/attendance';
import { useState, useEffect } from 'react';
import { Tabs, Button, Group, Text, Badge, Collapse } from '@mantine/core';
import { Calendar, CalendarDays, MapPin, Laptop } from 'lucide-react';
import axios from 'axios';

interface LeaveType {
    id: number;
    name: string;
}

interface MyAttendancePageProps {
    breadcrumbs?: BreadcrumbItem[];
    auth?: Auth;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'My Attendance',
        href: '/my/attendance',
    },
];

export default function MyAttendancePage(_props: MyAttendancePageProps) {
    const page = usePage<{ auth?: MyAttendancePageProps['auth'] }>();
    const auth = _props.auth ?? page.props.auth;
    const [activeTab, setActiveTab] = useState<string | null>('details');
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [todayStatus, setTodayStatus] = useState<string | null>(null);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [showRemoteWorkForm, setShowRemoteWorkForm] = useState(false);
    const [showFieldWorkForm, setShowFieldWorkForm] = useState(false);
    const [fieldWorkRefreshKey, setFieldWorkRefreshKey] = useState(0);

    useEffect(() => {
        if (activeTab !== 'leaves' || leaveTypes.length > 0) {
            return;
        }

        const fetchLeaveTypes = async () => {
            try {
                const response = await axios.get('/api/leave-types');
                setLeaveTypes(response.data.leave_types ?? []);
            } catch (err) {
                console.error('Failed to fetch leave types:', err);
            }
        };
        fetchLeaveTypes();
    }, [activeTab, leaveTypes.length]);

    useEffect(() => {
        if (activeTab !== 'details') {
            return;
        }

        const fetchTodayStatus = async () => {
            try {
                const response = await axios.get('/api/my/attendance/today');
                setTodayStatus(response.data.data?.status ?? null);
            } catch (err) {
                console.error('Failed to fetch today status:', err);
            }
        };
        fetchTodayStatus();
    }, [activeTab]);

    const handlePunchSuccess = () => {
        setTodayStatus('updated');
    };

    return (
        <>
            <Head title="My Attendance" />
            <AppLayout breadcrumbs={breadcrumbs} auth={auth}>
                <div className="p-4">
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        keepMounted={false}
                        className="w-full min-h-[300px]"
                    >
                        <Tabs.List>
                            <Tabs.Tab value="details">
                                <Group>
                                    <Calendar size={16} />
                                    <span>Details</span>
                                </Group>
                            </Tabs.Tab>
                            <Tabs.Tab value="calendar">
                                <Group>
                                    <CalendarDays size={16} />
                                    <span>Calendar</span>
                                </Group>
                            </Tabs.Tab>
                            <Tabs.Tab value="leaves">
                                <Group>
                                    <CalendarDays size={16} />
                                    <span>Leaves</span>
                                </Group>
                            </Tabs.Tab>
                            <Tabs.Tab value="remote">
                                <Group>
                                    <Laptop size={16} />
                                    <span>Remote Work</span>
                                </Group>
                            </Tabs.Tab>
                            <Tabs.Tab value="field">
                                <Group>
                                    <MapPin size={16} />
                                    <span>Field Work</span>
                                </Group>
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="details" pt="md">
                            {activeTab === 'details' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <TodayAttendanceStatus auth={auth} />
                                    <div className="flex justify-between items-center">
                                        <Text>Punch Section</Text>
                                        {todayStatus && (
                                            <Badge color={todayStatus === 'late_in' ? 'yellow' : todayStatus === 'present' ? 'green' : 'gray'}>
                                                {todayStatus.replace('_', ' ')}
                                            </Badge>
                                        )}
                                    </div>
                                    <PunchWidget auth={auth} onPunchSuccess={handlePunchSuccess} />
                                </div>
                            </div>}
                        </Tabs.Panel>

                        <Tabs.Panel value="calendar" pt="md">
                            {activeTab === 'calendar' && <AttendanceCalendar auth={auth} />}
                        </Tabs.Panel>

                        <Tabs.Panel value="leaves" pt="md">
                            {activeTab === 'leaves' && <div className="space-y-4">
                                <Group>
                                    <Button onClick={() => setShowLeaveForm(!showLeaveForm)}>
                                        {showLeaveForm ? 'Cancel' : 'New Leave Request'}
                                    </Button>
                                </Group>

                                    <Collapse in={showLeaveForm}>
                                        <LeaveRequestForm
                                            auth={auth}
                                            leaveTypes={leaveTypes}
                                            onSuccess={() => {
                                                setShowLeaveForm(false);
                                                setTodayStatus('updated');
                                            }}
                                        />
                                    </Collapse>

                                <LeaveBalanceDisplay auth={auth} />

                                <div className="mt-4">
                                    <Text mb="sm">Leave History</Text>
                                    <LeaveHistoryList auth={auth} />
                                </div>
                            </div>}
                        </Tabs.Panel>

                        <Tabs.Panel value="remote" pt="md">
                            {activeTab === 'remote' && <div className="space-y-4">
                                <Group>
                                    <Button onClick={() => setShowRemoteWorkForm(!showRemoteWorkForm)}>
                                        {showRemoteWorkForm ? 'Cancel' : 'New Remote Work Request'}
                                    </Button>
                                </Group>

                                <Collapse in={showRemoteWorkForm}>
                                    <RemoteWorkRequestForm
                                        auth={auth}
                                        onSuccess={() => setShowRemoteWorkForm(false)}
                                    />
                                </Collapse>

                                <div className="mt-4">
                                    <Text mb="sm">Remote Work History</Text>
                                    <RemoteWorkHistoryList auth={auth} />
                                </div>
                            </div>}
                        </Tabs.Panel>

                        <Tabs.Panel value="field" pt="md">
                            {activeTab === 'field' && <div className="space-y-4">
                                <Group>
                                    <Button onClick={() => setShowFieldWorkForm(!showFieldWorkForm)}>
                                        {showFieldWorkForm ? 'Cancel' : 'New Field Work Request'}
                                    </Button>
                                </Group>

                                <Collapse in={showFieldWorkForm}>
                                    <FieldWorkRequestForm
                                        auth={auth}
                                        onSuccess={() => {
                                            setShowFieldWorkForm(false);
                                            setFieldWorkRefreshKey((key) => key + 1);
                                        }}
                                    />
                                </Collapse>

                                <div className="mt-4">
                                    <Text mb="sm">Field Work History</Text>
                                    <FieldWorkHistoryList auth={auth} refreshKey={fieldWorkRefreshKey} />
                                </div>
                            </div>}
                        </Tabs.Panel>
                    </Tabs>
                </div>
            </AppLayout>
        </>
    );
}
