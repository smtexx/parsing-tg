const xlsx = require('xlsx');

/**
 * Write data into xlsx file and save created file in file system.
 *
 * @param {string} newFilePath - Absolute path to created xlsx file, filename includes.
 * @param {Array<{ name: string, headers: Array<string>, flatData: Array<{}>}>} sheetsConfig - Array
 *  with sheet data objects, where name is the name of new sheet, headers
 *  is array with names of columns, flatData is array with objects, each
 *  one is a row of data and each property is a cell.
 */

module.exports = function writeXlsxFile(newFilePath, sheetsConfig) {
  // Create new xlsx book
  const book = xlsx.utils.book_new();

  // Add new sheets into book
  sheetsConfig.forEach((config) => {
    // Create new sheet
    const sheet = xlsx.utils.json_to_sheet(config.flatData);

    // Rewrite headers
    xlsx.utils.sheet_add_aoa(sheet, [config.headers], {
      origin: 'A1',
    });

    // Set correct columns width
    const colWidths = config.flatData.reduce(
      (maxWidths, rowData) => {
        Object.values(rowData).forEach((cell, idx) => {
          if (maxWidths[idx] < cell.length) {
            maxWidths[idx] = cell.length;
          }
        });

        return maxWidths;
      },
      config.headers.map((header) => header.length)
    );

    // Set col widths
    sheet['!cols'] = colWidths.map((width) => ({
      wch: width + 1,
    }));

    // Add sheet into book
    xlsx.utils.book_append_sheet(book, sheet, config.name);
  });

  // Write book into file
  xlsx.writeFile(book, newFilePath, {
    compression: true,
  });
};
