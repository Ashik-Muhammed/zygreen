"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCertificate = exports.generateCertificate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const puppeteer = __importStar(require("puppeteer"));
const Handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Initialize Firebase Admin
admin.initializeApp();
// Get Firestore database instance
const db = admin.firestore();
// Load certificate template
const templatePath = path.join(__dirname, '../templates/certificate.html');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(templateSource);
exports.generateCertificate = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to generate a certificate.');
    }
    const { courseId } = data;
    const userId = context.auth.uid;
    try {
        // Get user and course data
        const [userDoc, courseDoc] = await Promise.all([
            db.collection('users').doc(userId).get(),
            db.collection('courses').doc(courseId).get()
        ]);
        if (!userDoc.exists || !courseDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User or course not found');
        }
        const userData = userDoc.data();
        const courseData = courseDoc.data();
        // Generate a unique certificate ID
        const certificateId = admin.firestore().collection('certificates').doc().id;
        const now = new Date();
        const certificateData = {
            studentName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            courseName: courseData.title || 'Unnamed Course',
            completionDate: now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            certificateId
        };
        // Generate PDF
        const pdfBuffer = await generatePdf(certificateData);
        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`certificates/${certificateId}.pdf`);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    firebaseStorageDownloadTokens: certificateId,
                    cacheControl: 'public, max-age=31536000'
                }
            }
        });
        // Get public URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2125' // 100 years from now
        });
        // Save certificate record
        const certificateDoc = {
            ...certificateData,
            userId,
            courseId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            pdfUrl: url
        };
        await db.collection('certificates').doc(certificateId).set(certificateDoc);
        return { url };
    }
    catch (error) {
        console.error('Error generating certificate:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate certificate', error);
    }
});
exports.verifyCertificate = functions.https.onCall(async (data) => {
    const { certificateId } = data;
    try {
        const certDoc = await db.collection('certificates').doc(certificateId).get();
        if (!certDoc.exists) {
            return { data: null };
        }
        return { data: certDoc.data() };
    }
    catch (error) {
        console.error('Error verifying certificate:', error);
        throw new functions.https.HttpsError('internal', 'Failed to verify certificate');
    }
});
async function generatePdf(data) {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        headless: true
    });
    try {
        const page = await browser.newPage();
        const html = template(data);
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });
        // Wait for fonts to be loaded
        await page.evaluateHandle('document.fonts.ready');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
            preferCSSPageSize: true
        });
        // Convert Uint8Array to Buffer
        return Buffer.from(pdfBuffer.buffer);
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=index.js.map