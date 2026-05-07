const colorMap = {
    orange: "border-orange-500 text-orange-500",
    blue: "border-blue-500 text-blue-500",
    purple: "border-purple-500 text-purple-500",
    green: "border-green-500 text-green-500",
};

const WizCardDesign1 = ({ title, text, stats, icon: Icon, color }: {
    title: string;
    text: string;
    stats: number;
    icon: React.ElementType;
    color: keyof typeof colorMap;
}) => {
    const colors = colorMap[color];

    return (
        <div className={`flex items-center justify-between gap-3 rounded-lg border-l-4 bg-muted px-4 py-3 ${colors}`}>
            <div className="flex items-start gap-3">
                <Icon className={`size-5 shrink-0 ${colors.split(" ")[1]}`} />
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                </div>
            </div>
            <p className="text-3xl font-medium leading-tight">{stats}</p>
        </div>
    );
};

export default WizCardDesign1;