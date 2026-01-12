/**
 * Certificate Generation Helper
 * Solves mobile download issues by rendering the certificate in a fixed-size
 * off-screen container before capturing. This ensures high resolution and
 * correct layout regardless of the device's viewport size.
 * 
 * Dependencies: html2canvas (https://html2canvas.hertzen.com/)
 */

const CertificateGenerator = {
    /**
     * Generates and downloads a certificate image.
     * @param {string} studentName - Name of the student
     * @param {string} courseTitle - Title of the course
     * @param {string} date - Completion date (optional)
     */
    download: async function(studentName, courseTitle, date = new Date().toLocaleDateString()) {
        // 1. Create a fixed-size container (A4 Landscape dimensions in pixels approx)
        // Using fixed dimensions prevents mobile layout shifts.
        const width = 1123; 
        const height = 794;
        
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: `${width}px`,
            height: `${height}px`,
            zIndex: '99999',
            backgroundColor: '#ffffff',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        });

        // 2. Inject Certificate HTML/CSS
        // We use inline styles to ensure the capture looks exactly as intended.
        container.innerHTML = `
            <div style="width: 100%; height: 100%; padding: 45px 20px 40px; box-sizing: border-box; border: 20px solid #2c3e50; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%); position: relative;">
                <!-- Decorative Corner -->
                <div style="position: absolute; top: 0; left: 0; width: 150px; height: 150px; background: linear-gradient(135deg, #e74c3c 50%, transparent 50%);"></div>
                
                <!-- Logo Area -->
                <div style="margin-bottom: 20px; font-size: 24px; font-weight: bold; color: #2c3e50;">Av_eSAFE Gurukul</div>

                <h1 style="font-size: 52px; color: #c0392b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Certificate</h1>
                <h2 style="font-size: 22px; color: #34495e; margin: 0 0 25px 0; font-weight: 300;">OF COMPLETION</h2>

                <p style="font-size: 24px; color: #7f8c8d; margin: 0;">This certifies that</p>
                
                <h3 style="font-size: 38px; color: #2c3e50; margin: 15px 0; border-bottom: 3px solid #c0392b; padding: 0 40px 10px;">${studentName}</h3>

                <p style="font-size: 24px; color: #7f8c8d; margin: 0;">has successfully completed the course</p>

                <h4 style="font-size: 32px; color: #2980b9; margin: 15px 0;">${courseTitle}</h4>

                <div style="margin-top: auto; display: flex; justify-content: space-between; width: 80%; padding: 0 40px 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #2c3e50;">${date}</div>
                        <div style="border-top: 1px solid #95a5a6; margin-top: 5px; padding-top: 5px; color: #95a5a6;">Date</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #2c3e50;">Av_eSAFE Director</div>
                        <div style="border-top: 1px solid #95a5a6; margin-top: 5px; padding-top: 5px; color: #95a5a6;">Signature</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        try {
            if (typeof html2canvas === 'undefined') {
                alert("Error: html2canvas library is missing. Please include it in your project.");
                return;
            }

            // 3. Capture with high scale for quality
            const isMobile = window.innerWidth < 900;
            const scale = isMobile ? 1.5 : 2;
            const canvas = await html2canvas(container, { scale: scale, useCORS: true, backgroundColor: '#ffffff' });
            const image = canvas.toDataURL("image/png");
            
            // 4. Trigger Download
            const link = document.createElement('a');
            link.href = image;
            link.download = `Certificate-${courseTitle.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Certificate generation error:", error);
            alert("Failed to generate certificate. Please try again.");
        } finally {
            document.body.removeChild(container);
        }
    }
};