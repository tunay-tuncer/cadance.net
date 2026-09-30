import { MailContentData, MailDesignConfig } from "@/types/mail";

export function generateResponsiveEmailHtml(
    content: MailContentData,
    design: MailDesignConfig
): string {
    const isDark = design.themeMode !== "light";
    const isMidnight = design.themeMode === "midnight";

    // Theme color palette
    const pageBg = isMidnight ? "#08080b" : isDark ? "#0d0d12" : "#f4f4f7";
    const cardBg = isMidnight ? "#111116" : isDark ? "#16161b" : "#ffffff";
    const borderColor = isMidnight ? "#1f1f28" : isDark ? "#26262e" : "#e4e4e7";
    const textPrimary = isDark ? "#ffffff" : "#0d0d12";
    const textSecondary = isDark ? "#a1a1aa" : "#52525b";
    const textMuted = isDark ? "#71717a" : "#71717a";
    const textDim = isDark ? "#52525b" : "#a1a1aa";
    const noticeBg = isDark ? "rgba(255, 255, 255, 0.02)" : "#f9fafb";
    const noticeBorder = isDark ? "rgba(255, 255, 255, 0.06)" : "#e5e7eb";

    const accentColor = design.accentColor || "#2972f5";
    const badgeColor = content.badgeColor || accentColor;

    // Button border radius
    let btnRadius = "6px";
    if (design.buttonStyle === "pill") btnRadius = "30px";
    if (design.buttonStyle === "sharp") btnRadius = "2px";

    // Secondary button styling
    const secBtnBg = isDark ? "#ffffff" : "#0d0d12";
    const secBtnText = isDark ? "#0d0d12" : "#ffffff";

    // Format info notice newlines into paragraphs
    const formattedNotice = content.infoNotice
        ? content.infoNotice
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line) => `<p style="margin: 0 0 6px 0; font-size: 11.5px; line-height: 1.5; color: ${textMuted};">${escapeHtml(line)}</p>`)
              .join("")
        : "";

    // Format bullet points
    const formattedBullets = content.bulletPoints
        .filter((b) => b.text.trim().length > 0)
        .map((b) => {
            // Highlight quotes and flow names dynamically
            let highlighted = escapeHtml(b.text);
            highlighted = highlighted.replace(
                /&quot;([^&]+)&quot;/g,
                `<strong style="color: ${accentColor}; font-weight: 600;">&quot;$1&quot;</strong>`
            );
            highlighted = highlighted.replace(
                /Cadance Flow/g,
                `<strong style="color: ${accentColor}; font-weight: 600;">Cadance Flow</strong>`
            );
            return `
              <tr>
                <td style="padding: 4px 0; font-family: ${design.fontFamily}; font-size: 13.5px; line-height: 1.55; color: ${textSecondary};">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td valign="top" style="width: 14px; padding-right: 8px; color: ${accentColor}; font-size: 14px; line-height: 1.4;">•</td>
                      <td valign="top" style="color: ${textSecondary}; font-size: 13.5px; line-height: 1.55;">
                        ${highlighted}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
        })
        .join("");

    // Optional Price Bid Card
    let bidCardHtml = "";
    if (content.bidDetails && content.bidDetails.projectName) {
        bidCardHtml = `
          <!-- BID SUMMARY CARD -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background: ${noticeBg}; border: 1px solid ${noticeBorder}; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 16px 20px; font-family: ${design.fontFamily};">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${accentColor}; font-weight: 700; padding-bottom: 4px;">
                      Proje & Teklif Özeti
                    </td>
                    <td align="right" style="font-size: 10px; font-weight: 600; padding: 2px 8px; background: rgba(16, 185, 129, 0.15); color: #10b981; border-radius: 10px;">
                      ${escapeHtml(content.bidDetails.validityPeriod || "Aktif")}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-size: 15px; font-weight: 700; color: ${textPrimary}; padding-top: 4px; padding-bottom: 2px;">
                      ${escapeHtml(content.bidDetails.projectName)}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-size: 12.5px; color: ${textSecondary}; padding-bottom: 12px; border-bottom: 1px dashed ${borderColor};">
                      ${escapeHtml(content.bidDetails.scopeText)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 10px; font-size: 12px; color: ${textMuted}; font-weight: 500;">
                      Toplam Teklif Bedeli
                    </td>
                    <td align="right" style="padding-top: 10px; font-size: 17px; font-weight: 800; color: #10b981;">
                      ${escapeHtml(content.bidDetails.priceAmount)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
    }

    return `<!DOCTYPE html>
<html lang="tr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="${isDark ? 'dark' : 'light'}">
  <meta name="supported-color-schemes" content="${isDark ? 'dark' : 'light'}">
  <title>${escapeHtml(content.subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* RESET STYLES */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: ${pageBg};
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      box-sizing: border-box;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
    }
    a {
      text-decoration: none;
    }
    /* RESPONSIVE MEDIA QUERIES */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
      }
      .card-padding {
        padding: 24px 20px !important;
      }
      .heading-title {
        font-size: 19px !important;
        line-height: 1.35 !important;
      }
      .mobile-full-btn {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin-bottom: 10px !important;
      }
      .hero-image {
        height: auto !important;
        max-height: 220px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${pageBg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- PREHEADER (HIDDEN INVOICE / EMAIL PREVIEW TEXT) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${escapeHtml(content.preheader)}
    &#847; &zwnj; &nbsp; &#8199; &#65279; &#847; &zwnj; &nbsp; &#8199; &#65279;
  </div>

  <!-- MAIN EMAIL WRAPPER TABLE -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${pageBg};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- EMAIL CONTAINER (MAX 580PX) -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="580">
        <tr>
        <td align="center" valign="top" width="580">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; margin: 0 auto;">
          
          <!-- TOP STUDIO BRANDING -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <span style="font-family: ${design.fontFamily}; font-size: 16px; font-weight: 800; letter-spacing: 0.18em; color: ${textPrimary}; text-transform: uppercase;">
                ${escapeHtml(design.studioName || "CADANCE STUDIO")}
              </span>
            </td>
          </tr>

          <!-- MAIN CARD CONTAINER -->
          <tr>
            <td style="background-color: ${cardBg}; border: ${design.showCardBorder ? `1px solid ${borderColor}` : "none"}; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 36px rgba(0, 0, 0, ${isDark ? '0.45' : '0.06'});">
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- HERO BANNER IMAGE (OPTIONAL) -->
                ${
                    design.showHeroImage && design.heroImageUrl
                        ? `
                <tr>
                  <td style="padding: ${isDark ? '14px 14px 0 14px' : '0'};">
                    <img src="${escapeHtml(design.heroImageUrl)}" 
                         alt="${escapeHtml(design.heroImageAlt || 'Cadance Studio')}" 
                         width="100%" 
                         class="hero-image"
                         style="width: 100%; max-width: 100%; height: 260px; object-fit: cover; display: block; border-radius: ${isDark ? '8px' : '12px 12px 0 0'};" />
                  </td>
                </tr>
                `
                        : ""
                }

                <!-- CARD INNER CONTENT PADDING -->
                <tr>
                  <td class="card-padding" style="padding: 32px 32px 36px 32px; font-family: ${design.fontFamily};">
                    
                    <!-- CATEGORY / BADGE -->
                    ${
                        content.badgeText
                            ? `
                    <div style="margin-bottom: 12px;">
                      <span style="display: inline-block; font-family: ${design.fontFamily}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${badgeColor};">
                        ${escapeHtml(content.badgeText)}
                      </span>
                    </div>
                    `
                            : ""
                    }

                    <!-- MAIN TITLE WITH HIGHLIGHTED RECIPIENT -->
                    <h1 class="heading-title" style="margin: 0 0 16px 0; font-family: ${design.fontFamily}; font-size: 22px; font-weight: 700; line-height: 1.35; color: ${textPrimary};">
                      ${escapeHtml(content.heading)} 
                      ${
                          content.highlightText
                              ? `<span style="color: ${accentColor}; font-weight: 700;">${escapeHtml(content.highlightText)}</span>`
                              : ""
                      }
                    </h1>

                    <!-- LEAD PARAGRAPH -->
                    <p style="margin: 0 0 22px 0; font-family: ${design.fontFamily}; font-size: 14px; line-height: 1.65; color: ${textSecondary};">
                      ${escapeHtml(content.leadParagraph)}
                    </p>

                    <!-- BID DETAILS IF PRESENT -->
                    ${bidCardHtml}

                    <!-- SUBHEADING -->
                    ${
                        content.subheading
                            ? `
                    <p style="margin: 0 0 10px 0; font-family: ${design.fontFamily}; font-size: 14px; font-weight: 700; color: ${textPrimary};">
                      ${escapeHtml(content.subheading)}
                    </p>
                    `
                            : ""
                    }

                    <!-- BULLET POINTS / INSTRUCTIONS LIST -->
                    ${
                        formattedBullets
                            ? `
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                      ${formattedBullets}
                    </table>
                    `
                            : ""
                    }

                    <!-- NOTICE / SECURITY BOX -->
                    ${
                        formattedNotice
                            ? `
                    <div style="margin: 20px 0 28px 0; padding: 14px 16px; background-color: ${noticeBg}; border: 1px solid ${noticeBorder}; border-radius: 8px;">
                      ${formattedNotice}
                    </div>
                    `
                            : ""
                    }

                    <!-- CALL TO ACTION BUTTONS -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <!-- BUTTON 1 (PRIMARY) -->
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="mobile-full-btn" style="margin-bottom: ${content.showSecondaryButton ? '10px' : '0'};">
                            <tr>
                              <td align="center" style="border-radius: ${btnRadius}; background-color: ${accentColor};">
                                <a href="${escapeHtml(content.primaryButtonUrl || '#')}" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   style="display: inline-block; padding: 12px 28px; font-family: ${design.fontFamily}; font-size: 13.5px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: ${btnRadius}; letter-spacing: 0.02em;">
                                  ${escapeHtml(content.primaryButtonText)}
                                </a>
                              </td>
                            </tr>
                          </table>

                          <!-- BUTTON 2 (SECONDARY - OPTIONAL) -->
                          ${
                              content.showSecondaryButton && content.secondaryButtonText
                                  ? `
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="mobile-full-btn">
                            <tr>
                              <td align="center" style="border-radius: ${btnRadius}; background-color: ${secBtnBg};">
                                <a href="${escapeHtml(content.secondaryButtonUrl || '#')}" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   style="display: inline-block; padding: 12px 28px; font-family: ${design.fontFamily}; font-size: 13.5px; font-weight: 700; color: ${secBtnText}; text-decoration: none; border-radius: ${btnRadius}; letter-spacing: 0.02em; border: 1px solid ${isDark ? '#e4e4e7' : '#0d0d12'};">
                                  ${escapeHtml(content.secondaryButtonText)}
                                </a>
                              </td>
                            </tr>
                          </table>
                          `
                                  : ""
                          }
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER AREA -->
          <tr>
            <td align="center" style="padding-top: 24px; padding-bottom: 20px; font-family: ${design.fontFamily};">
              ${
                  content.footerNote
                      ? `<p style="margin: 0 0 6px 0; font-size: 11.5px; line-height: 1.5; color: ${textDim}; text-align: center;">${escapeHtml(content.footerNote)}</p>`
                      : ""
              }
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: ${textDim}; text-align: center;">
                ${escapeHtml(content.copyrightText || "© 2026 Cadance Studio. All rights reserved.")}
              </p>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
