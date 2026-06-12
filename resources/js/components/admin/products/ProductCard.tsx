import { Product } from '@/types';
import { Text, Badge } from '@mantine/core';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type ProductCardProps = {
    product: Product;
};

// Deterministic accent per product id so color is stable across renders
const ACCENTS = [
    { border: '#185FA5', iconBg: '#E6F1FB', iconColor: '#185FA5' }, // blue
    { border: '#0F6E56', iconBg: '#E1F5EE', iconColor: '#0F6E56' }, // teal
    { border: '#854F0B', iconBg: '#FAEEDA', iconColor: '#854F0B' }, // amber
    { border: '#993C1D', iconBg: '#FAECE7', iconColor: '#993C1D' }, // coral
    { border: '#534AB7', iconBg: '#EEEDFE', iconColor: '#534AB7' }, // purple
];

const getAccent = (id: number) => ACCENTS[id % ACCENTS.length];

const ProductCard = ({ product }: ProductCardProps) => {
    const [counts, setCounts] = useState({ total: 0, active: 0, closed: 0 });
    const accent = getAccent(product.id);

    useEffect(() => {
        if (product.ticket_counts && product.ticket_counts.length > 0) {
            // existing ticket_counts logic
        } else {
            setCounts({ total: 0, active: 0, closed: 0 });
        }
    }, [product]);

    return (
        <Link
            href={`/admin/products/${product.id}/edit`}
            className="group relative flex flex-col overflow-hidden rounded-xl border bg-background transition-colors hover:bg-muted/30"
        >
            {/* Accent strip */}
            <div
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: accent.border }}
            />

            <div className="flex flex-1 flex-col gap-3 px-4 py-3.5 pl-5">

                {/* Icon + name */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                        style={{ background: accent.iconBg, color: accent.iconColor }}
                    >
                        {product.name?.charAt(0).toUpperCase()}
                    </div>
                    <Text size="sm" fw={500} lineClamp={1} className="flex-1">
                        {product.name}
                    </Text>
                </div>

                {/* Description */}
                <Text size="xs" c="dimmed" lineClamp={2} style={{ minHeight: '2.4em' }}>
                    {product.description || 'No description'}
                </Text>

                {/* Stats row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <div>
                            <Text size="xs" c="dimmed" lh={1}>Clients</Text>
                            <Text size="lg" fw={600} lh={1.2} style={{ letterSpacing: '-0.01em' }}>
                                {product.clients_count ?? 0}
                            </Text>
                        </div>
                        {counts.total > 0 && (
                            <>
                                <div>
                                    <Text size="xs" c="dimmed" lh={1}>Tickets</Text>
                                    <Text size="lg" fw={600} lh={1.2}>{counts.total}</Text>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed" lh={1}>Open</Text>
                                    <Text size="lg" fw={600} lh={1.2} c="orange">{counts.active}</Text>
                                </div>
                            </>
                        )}
                    </div>
                    <ArrowRight
                        size={15}
                        className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                    />
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;