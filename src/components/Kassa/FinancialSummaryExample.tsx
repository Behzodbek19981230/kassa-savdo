import { FinancialSummary } from './FinancialSummary';

// Example usage with the provided data
export function FinancialSummaryExample() {
    const exampleData = {
        filters: {
            filial_id: 1,
            year: 2026,
            month: 2,
            start_date: '2026-02-01',
            end_date: '2026-02-28',
        },
        summary: {
            net_revenue_usd: '-875.00',
            net_cashflow_usd: '-4505147.96',
        },
        orders: {
            count: 9,
            all_product_summa: '27680.00',
            profit_usd: '25530.00',
            total_paid_usd: '125.00',
            total_debt_client: '1359876.00',
            total_debt_today_client: '27555.00',
            payments: {
                dollar: '125.00',
                cash: '0.00',
                click: '0.00',
                terminal: '0.00',
                transfer: '0.00',
            },
            discount: '0.00',
            change: {
                usd: '0.00',
                uzs: '0.00',
            },
        },
        vozvrat: {
            count: 6,
            total_refunded_usd: '1000.00',
            payments: {
                dollar: '200.00',
                cash: '0.00',
                click: '0.00',
                terminal: '0.00',
                transfer: '0.00',
            },
            discount: '0.00',
        },
        expenses: {
            count: 2,
            total_usd: '4504000.00',
            payments: {
                dollar: '1000.00',
                cash: '0.00',
                click: '0.00',
                terminal: '0.00',
                transfer: '0.00',
            },
        },
        debt_repayments: {
            count: 4,
            total_paid_usd: '-272.96',
            payments: {
                dollar: '397.00',
                cash: '45375.00',
                click: '0.00',
                terminal: '54.00',
                transfer: '50560.25',
            },
            discount: '680.00',
            change: {
                usd: '230.00',
                uzs: '430.00',
            },
        },
    };

    return <FinancialSummary data={exampleData} />;
}
