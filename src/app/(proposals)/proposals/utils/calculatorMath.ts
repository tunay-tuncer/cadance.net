import { InvoiceWorkItem } from "@/lib/fireabase/invoiceWorkItemService";
import { ProjectItem } from "@/lib/fireabase/projectService";

export interface ItemProfitDetail {
    rawCost: number;
    profitShare: number;
    profitPrice: number;
    profitPercent: string;
    netProfitShare: number;
    taxShare: number;
}

export interface CalculationTotals {
    totalRawCost: number;
    nonBillableCost: number;
    profitTax: number;
    nonBillableTaxCompensation: number;
    totalTaxCompensation: number;
    effectiveProfit: number;
    totalOfferedPrice: number;
}

/**
 * Calculates financial totals and tax compensations for a given set of work items and profit settings
 */
export function calculateCalculationTotals(
    workItems: InvoiceWorkItem[],
    targetProfit: number,
    isProjectBilled: boolean,
    useGrossUp: boolean = false
): CalculationTotals {
    const totalRawCost = workItems.reduce((acc, item) => acc + (Number(item.rawCost) || 0), 0);
    const nonBillableCost = workItems
        .filter((item) => !item.canBeBilled)
        .reduce((acc, item) => acc + (Number(item.rawCost) || 0), 0);

    const incomeTaxRate = isProjectBilled ? 0.25 : 0;
    const profitTax = isProjectBilled ? Math.round(targetProfit * incomeTaxRate) : 0;
    const nonBillableTaxCompensation = isProjectBilled ? Math.round(nonBillableCost * incomeTaxRate) : 0;
    const totalTaxCompensation = profitTax + nonBillableTaxCompensation;

    let effectiveProfit = targetProfit;
    if (isProjectBilled) {
        if (targetProfit <= 0 && nonBillableCost <= 0) {
            effectiveProfit = 0;
        } else if (useGrossUp) {
            effectiveProfit = Math.round((targetProfit + nonBillableTaxCompensation) / 0.75);
        } else {
            effectiveProfit = targetProfit + totalTaxCompensation;
        }
    } else {
        effectiveProfit = targetProfit;
    }

    const totalOfferedPrice = totalRawCost + effectiveProfit;

    return {
        totalRawCost,
        nonBillableCost,
        profitTax,
        nonBillableTaxCompensation,
        totalTaxCompensation,
        effectiveProfit,
        totalOfferedPrice,
    };
}

/**
 * Calculates profit-added prices for project work items with explicit parameters
 */
export function calculateProfitPricesExplicit(
    workItems: InvoiceWorkItem[],
    targetProfit: number,
    isProjectBilled: boolean,
    useGrossUp: boolean = false
): Map<string, ItemProfitDetail> {
    const totals = calculateCalculationTotals(workItems, targetProfit, isProjectBilled, useGrossUp);
    const resultMap = new Map<string, ItemProfitDetail>();

    workItems.forEach((item, index) => {
        const itemCost = Number(item.rawCost) || 0;
        let share = 0;

        if (totals.effectiveProfit > 0) {
            if (totals.totalRawCost > 0) {
                share = Math.round(totals.effectiveProfit * (itemCost / totals.totalRawCost));
            } else if (workItems.length > 0) {
                share = Math.round(totals.effectiveProfit / workItems.length);
            }
        }

        const profitPrice = itemCost + share;
        const profitPercent = itemCost > 0 ? ((share / itemCost) * 100).toFixed(0) : "0";

        const netShare = isProjectBilled && totals.effectiveProfit > 0
            ? Math.round(share * (targetProfit / (totals.effectiveProfit || 1)))
            : share;
        const taxShare = share - netShare;

        const key = item.id || String(index);
        resultMap.set(key, {
            rawCost: itemCost,
            profitShare: share,
            profitPrice,
            profitPercent,
            netProfitShare: netShare,
            taxShare,
        });
    });

    return resultMap;
}

/**
 * Calculates profit-added prices for project work items given a ProjectItem
 */
export function calculateProfitAddedPrices(
    workItems: InvoiceWorkItem[],
    project: ProjectItem | null | undefined,
    useGrossUp: boolean = false
): Map<string, ItemProfitDetail> {
    const targetProfit = Number(project?.targetProfit) || 0;
    const isProjectBilled = Boolean(project?.isBilled);
    return calculateProfitPricesExplicit(workItems, targetProfit, isProjectBilled, useGrossUp);
}
