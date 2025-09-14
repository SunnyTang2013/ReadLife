
export default {
  pdfMultiLineText(docPDF,
    pageWidth,
    pageHeight,
    xMargin,
    yMargin,
    yStartPos,
    textToPrint,
    fontSize = 10,
    fontName = 'times',
    fontColor = '#000000') {
    docPDF.setFontSize(fontSize);
    docPDF.setFont(fontName);
    docPDF.setTextColor(fontColor);
    const lineHeight = docPDF.getLineHeight();
    const wrappedText = docPDF.splitTextToSize(textToPrint, pageWidth);
    let nextTextPos = -1;
    let firstBloc = true;
    console.log('pagewidth real', docPDF.internal.pageSize.getWidth());
    console.log('pagewidth defined', pageWidth);
    wrappedText.forEach((line) => {
      // first bloc to write
      if (firstBloc === true) {
        firstBloc = false;
        nextTextPos = yStartPos;
      } else {
        if (nextTextPos > pageHeight) {
          docPDF.addPage();
          nextTextPos = -1;
        }
        if (nextTextPos === -1) {
          nextTextPos = yMargin;
        } else {
          nextTextPos += lineHeight;
        }
      }
      docPDF.text(line, xMargin, nextTextPos);
    });
    // return latest pos to adjust new text pos
    return nextTextPos + lineHeight;
  },

  pdfSliceAndExportImage(docPDF,
    pageWidth,
    pageHeight,
    xMargin,
    yMargin,
    yStartPos,
    imgToDisplay,
    marginX = 20,
    marginY = 20) {
    // eslint-disable-next-line no-param-reassign

    const displayHeight = imgToDisplay.height;
    const displayWidth = imgToDisplay.width;
    let heightAlreadyDisplayed = 0;

    const sX = 0;
    let sY = 0;
    const dX = 0;
    const dY = 0;

    /* eslint-disable no-param-reassign */
    marginY = 0;
    marginX = 0;
    pageHeight -= (2 * marginY);
    let remainingHight = displayHeight - heightAlreadyDisplayed;

    while (remainingHight > 0) {
      // retreive old height to capture img part
      let sourceHeightToDisplay = 0;
      if (pageHeight > remainingHight) {
        sourceHeightToDisplay = remainingHight + (2 * marginY);
      } else {
        sourceHeightToDisplay = pageHeight;
      }

      const onePageCanvas = document.createElement('canvas');
      onePageCanvas.setAttribute('width', displayWidth); //* *** checked in next step
      onePageCanvas.setAttribute('height', sourceHeightToDisplay);
      const canvaContext = onePageCanvas.getContext('2d');
      canvaContext.drawImage(imgToDisplay,
        sX,
        sY,
        displayWidth,
        sourceHeightToDisplay,
        dX,
        dY,
        displayWidth,
        sourceHeightToDisplay);

      const onePageCanvasDataURL = onePageCanvas.toDataURL('image/png', 1);
      heightAlreadyDisplayed += sourceHeightToDisplay;
      sY += sourceHeightToDisplay - (2 * marginY);
      remainingHight = (displayHeight - heightAlreadyDisplayed);
      if (pageHeight < remainingHight) {
        docPDF.addImage(onePageCanvasDataURL, 'PNG', marginX, marginY, displayWidth, pageHeight, '', 'FAST');
      } else {
        docPDF.addImage(onePageCanvasDataURL, 'PNG', marginX, marginY, displayWidth, sourceHeightToDisplay, '', 'FAST');
      }

      if (heightAlreadyDisplayed < displayHeight) {
        docPDF.addPage();
      }
    }
  },
};
