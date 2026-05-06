import { Task, TaskHistory } from "@/types";
import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@mantine/core";

const TaskHistories = ({ task }: { task: Task }) => {
    const [histories, setHistories] = useState<TaskHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistories = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/data/tasks/${task.id}/history`);
                setHistories(response.data?.data || response.data || []);
            } catch (error) {
                console.error('Error fetching histories:', error);
            } finally {
                setLoading(false);
            }
        };

        if (task.id) {
            fetchHistories();
        }
    }, [task.id]);

    if (loading) {
        return <div className="text-center py-8">Loading history...</div>;
    }

    return (
        <div className="space-y-4">
            {histories.length > 0 ? (
                histories.map((history) => (
                    <div key={history.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                    Status Change
                                </span>
                                <Badge size="sm" variant="light">{history.old_status} → {history.new_status}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(history.created_at).toLocaleString()}
                            </div>
                        </div>
                        {history.changed_by_user && (
                            <div className="mt-2 text-sm text-gray-700">
                                Changed by: {history.changed_by_user.name}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">No history available</div>
            )}
        </div>
    );
};

export default TaskHistories;
