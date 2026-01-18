import React from "react";
import FlowingMenu from "../FlowingMenu";

const MENU_ITEMS = [
    { link: '#', text: 'Multi-Dimensional Prediction Market', image: '/flowingmenu/Multi-Dimensional_Prediction_Market.png' },
    { link: '#', text: 'Unified Liquidity', image: '/flowingmenu/Unified_Liquidity.png' },
    { link: '#', text: 'World Table', image: '/flowingmenu/World_Table.png' },
    { link: '#', text: 'Marginals', image: '/flowingmenu/Marginals.png' },
    { link: '#', text: 'Slices', image: '/flowingmenu/Slice.png' },
    { link: '#', text: 'Corners', image: '/flowingmenu/Corners.png' },
    { link: '#', text: 'Coherent Pricing', image: '/flowingmenu/Coherent_Pricing.png' },
    { link: '#', text: 'LMSR', image: '/flowingmenu/LSMR.png' },
    { link: '#', text: 'Privacy', image: '/flowingmenu/Privacy.png' }
];

const FlowingMenuSection = () => {
    return (
        <section className="h-screen w-full">
            <FlowingMenu items={MENU_ITEMS} />
        </section>
    );
};

export default FlowingMenuSection;
