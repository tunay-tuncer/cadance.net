export type EmailThemeMode = 'dark' | 'light' | 'midnight';
export type ButtonStyleMode = 'rounded' | 'pill' | 'sharp';

export interface BulletItem {
    id: string;
    text: string;
}

export interface MailContentData {
    clientEmail: string;
    clientName: string;
    ccEmail?: string;
    bccEmail?: string;
    subject: string;
    preheader: string; // Preview text shown in email clients
    badgeText: string;
    badgeColor?: string;
    heading: string;
    highlightText: string;
    leadParagraph: string;
    subheading?: string;
    bulletPoints: BulletItem[];
    infoNotice?: string;
    primaryButtonText: string;
    primaryButtonUrl: string;
    showSecondaryButton: boolean;
    secondaryButtonText: string;
    secondaryButtonUrl: string;
    footerNote: string;
    copyrightText: string;
    // Specific for price bid
    bidDetails?: {
        projectName: string;
        scopeText: string;
        priceAmount: string;
        validityPeriod: string;
    };
}

export interface MailDesignConfig {
    accentColor: string;
    themeMode: EmailThemeMode;
    showHeroImage: boolean;
    heroImageUrl: string;
    heroImageAlt: string;
    studioName: string;
    buttonStyle: ButtonStyleMode;
    fontFamily: string;
    showCardBorder: boolean;
}

export interface MailTemplate {
    id: string;
    name: string;
    category: 'standard' | 'cadance-flow' | 'portfolio' | 'bid-contract' | 'milestone';
    description: string;
    badge: string;
    defaultContent: MailContentData;
    defaultDesign: MailDesignConfig;
}
