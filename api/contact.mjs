// /api/contact.mjs  (Node/ESM på Vercel)
import nodemailer from "nodemailer";

/** Læs påkrævet env eller kast klar fejl */
const req = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`ENV_MISSING:${k}`);
  return v;
};

/** Ens signatur til alle mails (indsat som HTML) */
const SIGNATURE_HTML = `
<div data-spark-custom-html="true">
    <div dir="auto">
        <table cellpadding="0" style="border-collapse: collapse;">
            <tbody>
                <tr>
                    <td style="margin: 0.1px; padding: 10px 0px;"><img width="500" src="https://fyrrehaven-61.dk/wp-content/uploads/365480BBE754414FA58777FD7DD1100F.png" alt="Best regards," style="max-width: 100%; height: auto;"></td>
                </tr>
            </tbody>
        </table>
        <table cellpadding="0" width="500" style="border-collapse: collapse; font-size: 13.1px;">
            <tbody>
                <tr>
                    <td style="margin: 0.1px; padding: 0px;">
                        <table cellpadding="0" style="border-collapse: collapse;">
                            <tbody>
                                <tr>
                                    <td valign="top" style="margin: 0.1px; padding: 0px 12px 0px 0px; cursor: pointer;"><a href="fyrrehaven-61.dk" target="_blank"><img src="https://fyrrehaven-61.dk/wp-content/uploads/logo_trans_white_comp-1.png" width="100" alt="" style="display: block; min-width: 100px; max-width: 100%; height: auto;"></a></td>
                                    <td valign="top" style="
                                              border-left-width: 1px;
                                              border-left-style: solid;
                                              border-left-color: rgb(126, 119, 38);
                                              margin: 0.1px;
                                              padding: 0px 0px 0px 12px;
                                              font-family: Tahoma, Geneva, sans-serif;
                                              color: rgb(0, 0, 1);
                                          ">
                                        <table cellpadding="0" style="border-collapse: collapse;">
                                            <tbody>
                                                <tr>
                                                    <td style="
                                                              padding: 0px 0px 8px;
                                                              font-weight: 600;
                                                              font-size: 17.1px;
                                                              color: rgb(126, 119, 38);
                                                          ">
                                                        Fyrrehaven 61
                                                    </td>
                                                </tr>
                                                <tr style="cursor: pointer;">
                                                    <td><a href="mailto:kontakt@fyrrehaven-61.dk" target="_blank" style="color: rgb(126, 119, 38); text-decoration: none; font-family: Tahoma, Geneva, sans-serif;">kontakt@fyrrehaven-61.dk</a></td>
                                                </tr>
                                                <tr style="cursor: pointer;">
                                                    <td><span style="color: rgb(126, 119, 38);">Fjellerup Strand</span></td>
                                                </tr>
                                                <tr style="cursor: pointer;">
                                                    <td><a href="https://fyrrehaven-61.dk" target="_blank" style="color: rgb(126, 119, 38); text-decoration: none; font-family: Tahoma, Geneva, sans-serif;">fyrrehaven-61.dk</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 0px 0px;">
                                                        <table cellpadding="0" style="border-collapse: collapse;">
                                                            <tbody>
                                                                <tr>
                                                                    <td style="padding: 0px 5px 0px 0px; cursor: pointer;">
                                                                        <a href="https://www.facebook.com/fyrrehaven61" target="_blank" style="display: block; border-radius: 15%; width: 22px; height: 22px; text-align: center; background-color: rgb(126, 119, 38);">
                                                                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position: relative; top: 4.4px; width: 13.2px;">
                                                                                <path d="M1024 512.329c0-282.951-229.23-512.329-512-512.329s-512 229.378-512 512.329c0 255.715 187.23 467.671 432 506.101v-358.005h-130v-148.096h130v-112.872c0-128.403 76.44-199.328 193.39-199.328 56 0 114.61 10.006 114.61 10.006v126.081h-64.56c-63.6 0-83.44 39.496-83.44 80.052v96.061h142l-22.7 148.096h-119.3v358.005c244.77-38.43 432-250.386 432-506.101z" fill="#FFFFFF"></path>
                                                                            </svg>
                                                                        </a>
                                                                    </td>
                                                                    <td style="padding: 0px 5px 0px 0px; cursor: pointer;">
                                                                        <a href="https://www.instagram.com/fyrrehaven61/" target="_blank" style="display: block; border-radius: 15%; width: 22px; height: 22px; text-align: center; background-color: rgb(126, 119, 38);">
                                                                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position: relative; top: 4.4px; width: 13.2px;">
                                                                                <path d="M682.653 512c0-93.991-76.659-170.654-170.654-170.654s-170.654 76.659-170.654 170.654c0 93.995 76.659 170.654 170.654 170.654s170.654-76.659 170.654-170.654zM774.646 512c0 145.323-117.325 262.645-262.645 262.645s-262.645-117.325-262.645-262.645c0-145.32 117.325-262.645 262.645-262.645s262.645 117.325 262.645 262.645zM846.641 238.688c0 33.997-27.331 61.328-61.328 61.328s-61.328-27.331-61.328-61.328c0-33.996 27.331-61.328 61.328-61.328s61.328 27.331 61.328 61.328v0zM512 92.033c-74.66 0-234.647-5.999-301.975 20.666-23.331 9.332-40.662 20.666-58.661 38.662s-29.33 35.33-38.662 58.661c-26.666 67.328-20.666 227.315-20.666 301.975s-5.999 234.647 20.666 301.975c9.332 23.331 20.666 40.662 38.662 58.661s35.33 29.33 58.661 38.662c67.328 26.666 227.315 20.666 301.975 20.666s234.647 5.999 301.975-20.666c23.331-9.332 40.662-20.666 58.661-38.662s29.33-35.33 38.662-58.661c26.666-67.328 20.666-227.315 20.666-301.975s-0.667-234.647 3.332-301.975c4-81.995 22.666-154.655 82.66-214.651s132.656-78.66 214.651-82.66c70.66-4 140.655-3.332 211.316-3.332s140.655-0.667 211.316 3.332c81.995 4 154.655 22.666 214.651 82.66s78.66 132.656 82.66 214.651c4 70.66 3.332 140.655 3.332 211.316z" fill="#FFFFFF"></path>
                                                                            </svg>
                                                                        </a>
                                                                    </td>
                                                                    <td style="padding: 0px 5px 0px 0px; cursor: pointer;">
                                                                        <a href="https://www.tiktok.com/@fyrrehaven61" target="_blank" style="display: block; border-radius: 15%; width: 22px; height: 22px; text-align: center; background-color: rgb(126, 119, 38);">
                                                                            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="position: relative; top: 4.4px; width: 13.2px;">
                                                                                <path d="M959.851 414.292c-8.556 0.813-17.146 1.239-25.742 1.277-94.288 0.013-182.228-46.466-233.877-123.613v420.932c0 171.822-142.425 311.111-318.116 311.111s-318.116-139.289-318.116-311.111c0-171.822 142.425-311.111 318.116-311.111 6.641 0 13.132 0.584 19.661 0.985v153.312c-6.529-0.766-12.945-1.934-19.661-1.934-89.669 0-162.36 71.090-162.36 158.785s72.691 158.785 162.36 158.785c89.686 0 168.888-69.103 168.888-156.814l1.567-714.895h149.974c14.142 131.528 122.584 234.263 257.455 243.905v170.387z" fill="#FFFFFF"></path>
                                                                            </svg>
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
        <table width="500" cellspacing="0" cellpadding="0" border="0">
            <tbody>
                <tr>
                    <td style="margin: 0.1px; line-height: 1px; font-size: 1px; height: 1px;">&nbsp;</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
`;

export default async function handler(req_, res) {
  try {
    if (req_.method !== "POST") {
      res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
      return;
    }

    /** ---- Body ---- */
    const {
      lang,
      name,
      email,
      phone, // optional
      country, // optional (label)
      countryIso, // optional (fallback hvis country ikke er sat)
      message,
      context = "contact",
    } = req_.body ?? {};

    if (!name || !email || !message) {
      res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        detail: "Missing required fields",
      });
      return;
    }

    /** ---- SMTP ---- */
    const host = req("SMTP_HOST"); // fx smtp.simply.com
    const port = Number(process.env.SMTP_PORT || 587);
    const user = req("SMTP_USER");
    const pass = req("SMTP_PASS");
    const from = req("MAIL_FROM"); // fx "Fyrrehaven 61 <kontakt@...>"
    const to = req("MAIL_TO"); // modtager (jer)

    const secure =
      String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
      port === 465;
    const tlsInsecure =
      String(process.env.SMTP_TLS_INSECURE || "").toLowerCase() === "true";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      requireTLS: !secure,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: {
        minVersion: "TLSv1.2",
        ...(tlsInsecure ? { rejectUnauthorized: false } : {}),
      },
    });

    await transporter.verify();

    /** ---- Mail til jer (internt) ---- */
    const subjectAdmin =
      lang === "da"
        ? `Ny henvendelse (${context})`
        : `New message (${context})`;

    const introAdmin =
      lang === "da"
        ? "Der er indsendt en ny henvendelse fra websitet:"
        : "A new message was submitted from the website:";

    const countryShown = country || countryIso || "";

    const htmlAdmin = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        <p>${introAdmin}</p>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 8px"><b>Navn / Name</b></td><td style="padding:4px 8px">${escapeHtml(
            name
          )}</td></tr>
          <tr><td style="padding:4px 8px"><b>E-mail</b></td><td style="padding:4px 8px">${escapeHtml(
            email
          )}</td></tr>
          ${
            phone
              ? `<tr><td style="padding:4px 8px"><b>Telefon / Phone</b></td><td style="padding:4px 8px">${escapeHtml(
                  phone
                )}</td></tr>`
              : ""
          }
          ${
            countryShown
              ? `<tr><td style="padding:4px 8px"><b>Land / Country</b></td><td style="padding:4px 8px">${escapeHtml(
                  countryShown
                )}</td></tr>`
              : ""
          }
          <tr><td style="padding:4px 8px"><b>Sprog / Lang</b></td><td style="padding:4px 8px">${
            lang || "n/a"
          }</td></tr>
          <tr><td style="padding:4px 8px"><b>Kontekst / Context</b></td><td style="padding:4px 8px">${escapeHtml(
            context
          )}</td></tr>
        </table>
        <p><b>Besked / Message</b></p>
        <pre style="white-space:pre-wrap;background:#f6f6f6;border:1px solid #eee;border-radius:6px;padding:12px">${escapeHtml(
          message
        )}</pre>
        ${SIGNATURE_HTML}
      </div>
    `;

    const textAdmin =
      `${introAdmin}\n\n` +
      `Navn/Name: ${name}\n` +
      `E-mail: ${email}\n` +
      (phone ? `Telefon/Phone: ${phone}\n` : "") +
      (countryShown ? `Land/Country: ${countryShown}\n` : "") +
      `Sprog/Lang: ${lang || "n/a"}\n` +
      `Kontekst/Context: ${context}\n\n` +
      `Besked/Message:\n${message}\n`;

    const infoAdmin = await transporter.sendMail({
      from,
      to,
      subject: subjectAdmin,
      html: htmlAdmin,
      text: textAdmin,
      replyTo: email, // svar går til afsender
    });

    /** ---- Auto-reply til afsender (uden ekko af indhold) ---- */
    const siteName = process.env.SITE_NAME || "Fyrrehaven 61";

    const subjectUser =
      lang === "da"
        ? `Tak for din henvendelse – ${siteName}`
        : `Thanks for your message – ${siteName}`;

    const bodyUser =
      lang === "da"
        ? `<p>Tak for din henvendelse. Vi har modtaget din besked og vender tilbage snarest muligt.</p>`
        : `<p>Thanks for your message. We’ve received your inquiry and will get back to you as soon as possible.</p>`;

    const htmlUser = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
        ${bodyUser}
        ${SIGNATURE_HTML}
      </div>
    `;

    const textUser =
      lang === "da"
        ? `Tak for din henvendelse. Vi har modtaget din besked og vender tilbage snarest muligt.\n\n${siteName}\nhttps://fyrrehaven-61.dk`
        : `Thanks for your message. We’ve received your inquiry and will get back to you as soon as possible.\n\n${siteName}\nhttps://fyrrehaven-61.dk`;

    // Send auto-svar — fejler det, svarer vi stadig ok til brugeren
    try {
      await transporter.sendMail({
        from, // vis "Fyrrehaven 61 <kontakt@...>"
        to: email, // afsenderens adresse
        subject: subjectUser,
        html: htmlUser,
        text: textUser,
        replyTo: to, // hvis de svarer, går det til jer
      });
    } catch (autoErr) {
      console.error("MAIL_AUTOREPLY_ERROR", autoErr);
      // fortsæt uden at fejle hele requesten
    }

    res.status(200).json({ ok: true, id: infoAdmin.messageId || null });
  } catch (err) {
    console.error("MAIL_ERROR", err);
    const msg = String(err && err.message ? err.message : err);

    if (msg.startsWith("ENV_MISSING:")) {
      res.status(500).json({
        ok: false,
        error: "ENV_MISSING",
        detail: msg.replace("ENV_MISSING:", "Missing env: "),
      });
      return;
    }
    res.status(500).json({ ok: false, error: "MAIL_ERROR", detail: msg });
  }
}

/** Simple HTML escape */
function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
