import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CryptoPriceStripProps {
    targetPrice: number;
    currentPrice: number;
    priceChange24h?: number;
}

export function CryptoPriceStrip({ targetPrice, currentPrice, priceChange24h = 0 }: CryptoPriceStripProps) {
    const isUp = priceChange24h >= 0;

    // Helper to format currency nicely (e.g. $95,315.23)
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    return (
        <div className="flex items-center gap-6 mt-1.5 ml-0.5">
            {/* Price To Beat Section */}
            <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                    Price To Beat
                </span>
                <span className="text-[20px] font-bold text-gray-400 leading-none tracking-tight">
                    {formatCurrency(targetPrice)}
                </span>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-gray-200/60" />

            {/* Current Price Section */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">
                        Current Price
                    </span>
                    <div className={cn(
                        "flex items-center gap-0.5 px-1 rounded text-[10px] font-bold",
                        isUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                    )}>
                        {isUp ? <ArrowUp className="size-2.5" strokeWidth={3} /> : <ArrowDown className="size-2.5" strokeWidth={3} />}
                        <span>${Math.abs(priceChange24h).toFixed(2)}</span>
                    </div>
                </div>
                <span className="text-[20px] font-bold text-orange-500 leading-none tracking-tight">
                    {formatCurrency(currentPrice)}
                </span>
            </div>


        </div>
    );
}
