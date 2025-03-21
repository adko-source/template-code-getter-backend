async function generateTemplateCodesList(uploadedFile) {
  let templateCodesList = [];
  let result = { "error": false, "templateCodesList": templateCodesList };

  console.log('uploadedFile', uploadedFile);

  const filePath = uploadedFile.path;

  // Read the Clinical Form XML
  await new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, fileData) => {
          if (err) {
              console.error('Error reading the file:', err);
              reject(err);
              result.error = true;
              return result;
          }

          // Parse XML data with order preservation
          xml2js.parseString(fileData, {
              preserveChildrenOrder: true,
              explicitChildren: true,
              explicitArray: false
          }, (parseErr, parsedXML) => {
              if (parseErr) {
                  console.error('Error parsing XML:', parseErr);
                  reject(parseErr);
                  result.error = true;
                  return result;
              }

              // Traverse XML to extract required elements
              if (parsedXML.form) {
                  traverseXML(parsedXML.form);
              }
              resolve();
          });
      });
  });

  function traverseXML(node) {
      if (!node || typeof node !== 'object') return;

      // If the node has a label and code, add it to the list
      if (node.$ && node.$.label && node.$.code) {
          let textContent = `${node.$.label}: {Appointment.Fields.${node.$.code}.List}`;
          templateCodesList.push(textContent);
      }

      // Process child elements in the exact order they appear in XML
      if (Array.isArray(node.$$)) {
          node.$$.forEach(child => traverseXML(child));
      }
  }

  try {
      // Delete the file after successful processing
      fs.unlink(filePath, (err) => {
          if (err) {
              console.error('Error deleting the file:', err);
          } else {
              console.log('File deleted successfully from uploads folder:', filePath);
          }
      });
  } catch (error) {
      console.error('Error uploading document:', error.message || error);
  }

  return result;
}
