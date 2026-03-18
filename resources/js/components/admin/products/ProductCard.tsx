import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Product } from '@/types';
import React, { useEffect, useState } from 'react'

type ProductCardProps = {
    product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
    const [counts, setCounts] = useState({ total: 0, active: 0, closed: 0 });

    const handleClick = () => {
        console.log(product.ticket_counts && product.ticket_counts.length > 0 ? product.ticket_counts : 0);
        console.log(counts);
    }

    useEffect(() => {
        if (product.ticket_counts && product.ticket_counts.length > 0) {
        //    
        } else {
            setCounts({ total: 0, active: 0, closed: 0 })
        }
    }, [product])




    return (
        <>
            <Card className='w-[300px]' onClick={handleClick}>
                <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                        {product.description || 'No description'}
                    </CardDescription>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-end px-3 py-2 min-w-[70px] rounded-md bg-neutral-50 border border-neutral-200">
                                <span className="text-xs font-semibold text-neutral-700">Clients</span>
                                <span className="text-2xl font-bold text-neutral-900 leading-tight tabular-nums">
                                    {product.clients_count ?? 0}
                                </span>
                            </div>
                            {/* total raised Tickets */}
                            {/* total solved Tickets */}
                        </div>
                    </CardContent>
                </CardHeader>
            </Card>

        </>
    );
};
export default ProductCard
