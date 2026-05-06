import { Task } from "@/types";
import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@mantine/core";
import { toast } from "sonner";

type TaskForwardingRecord = {
    id: number;
    from_label?: string;
    to_label?: string;
    from_department?: {
        name?: string | null;
    } | null;
    to_department?: {
        name?: string | null;
    } | null;
    status?: string;
    created_at: string;
    reason?: string | null;
    notes?: string | null;
    forwarded_by_user?: {
        name?: string | null;
    } | null;
    forwarded_by?: {
        name?: string | null;
    } | null;
};

type EmployeeOption = {
    id: number;
    name: string;
    email?: string | null;
    department_name?: string | null;
};

const TaskForwarding = ({ task }: { task: Task }) => {
    const [forwardings, setForwardings] = useState<TaskForwardingRecord[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [toUserId, setToUserId] = useState<string>("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchForwardings = async () => {
        try {
            const response = await axios.get(`/data/tasks/${task.id}/forwardings`);
            setForwardings(response.data?.data || response.data || []);
        } catch (error) {
            console.error("Error fetching forwardings:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get("/admin/data/users/assignment");
            const userList = response.data?.users || response.data?.data || [];
            setEmployees(userList);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchForwardings(), fetchEmployees()]);
            setLoading(false);
        };

        if (task.id) {
            fetchData();
        }
    }, [task.id]);

    const handleForwardTask = async () => {
        if (!toUserId) {
            toast.error("Please select an employee");
            return;
        }

        if (!reason.trim()) {
            toast.error("Please provide a forwarding reason");
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`/data/tasks/${task.id}/forwardings`, {
                to_user_id: Number(toUserId),
                reason: reason.trim(),
                notes: notes.trim() || null,
            });

            toast.success("Task forwarded successfully");
            setToUserId("");
            setReason("");
            setNotes("");
            await fetchForwardings();
        } catch (error: any) {
            const message = error?.response?.data?.message || "Failed to forward task";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const assignedUserIds = new Set<number>(
        (task.assigned_users || task.assignedUsers || []).map((assignedUser) => Number(assignedUser.id)),
    );

    const selectableEmployees = employees.filter(
        (employee) => !assignedUserIds.has(Number(employee.id)),
    );

    if (loading) {
        return <div className="text-center py-8">Loading forwardings...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
                <h3 className="text-sm font-semibold">Forward Task</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        To Employee
                    </label>
                    <select
                        value={toUserId}
                        onChange={(event) => setToUserId(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        disabled={submitting}
                    >
                        <option value="">Select employee</option>
                        {selectableEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}{employee.department_name ? ` (${employee.department_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Reason
                    </label>
                    <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Why are you forwarding this task?"
                        disabled={submitting}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Additional notes"
                        disabled={submitting}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleForwardTask}
                    className="inline-flex items-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={submitting}
                >
                    {submitting ? "Forwarding..." : "Forward"}
                </button>
            </div>

            {forwardings.length > 0 ? (
                forwardings.map((forwarding, index) => (
                    <div key={forwarding.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                    {forwarding.from_label || forwarding.from_department?.name || 'Unknown'} {'->'} {forwarding.to_label || forwarding.to_department?.name || 'Unknown'}
                                </span>
                                <Badge size="sm" variant="light">{forwarding.status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(forwarding.created_at).toLocaleString()}
                            </div>
                        </div>
                        {forwarding.reason && (
                            <div className="mt-2 text-sm text-gray-700">
                                <strong>Reason:</strong> {forwarding.reason}
                            </div>
                        )}
                        {forwarding.notes && (
                            <div className="mt-1 text-xs text-gray-600">
                                <strong>Notes:</strong> {forwarding.notes}
                            </div>
                        )}
                        <div className="mt-1 text-xs text-gray-600">
                            Step {index + 1}
                        </div>
                        {forwarding.forwarded_by_user && (
                            <div className="mt-1 text-xs text-gray-600">
                                Forwarded by: {forwarding.forwarded_by_user.name}
                            </div>
                        )}
                        {!forwarding.forwarded_by_user && forwarding.forwarded_by && (
                            <div className="mt-1 text-xs text-gray-600">
                                Forwarded by: {forwarding.forwarded_by.name}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">No forwarding records available</div>
            )}
        </div>
    );
};

export default TaskForwarding;
