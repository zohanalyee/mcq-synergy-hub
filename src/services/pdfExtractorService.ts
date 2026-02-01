import * as pdfjsLib from "pdfjs-dist";

// Fully disable worker to avoid CDN loading issues on mobile + Lovable environment
(pdfjsLib as any).disableWorker = true;

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pageCount: number;
}

export const pdfExtractorService = {
  /**
   * Extract text from a PDF file
   * @param file - The PDF file to extract text from
   * @param onProgress - Callback for progress updates
   * @returns Promise with extracted text and page count
   */
  async extractText(
    file: File,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<ExtractionResult> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const totalPages = pdf.numPages;
    let fullText = "";

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text items and join them
      const pageText = textContent.items
        .map((item) => {
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      fullText += pageText + "\n\n";

      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages,
          text: fullText,
        });
      }

      // Yield to UI thread to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return {
      text: fullText.trim(),
      pageCount: totalPages,
    };
  },

  /**
   * Get basic PDF info without full extraction
   */
  async getPdfInfo(file: File): Promise<{ pageCount: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return { pageCount: pdf.numPages };
  },
};
