// // // Dataverse download handler
// // console.log("Dataverse download script loaded");
// document.addEventListener('DOMContentLoaded', function() {
//     console.log("DOM content loaded");

//     // The 2 values below are the only ones you need to change.
//     const DOMAIN = "https://archive.data.jhu.edu";
//     const DOI = "10.7281/T1/JC64MK";
    
//     // Find all download links in tables - target links in the download column
//     const downloadLinks = document.querySelectorAll('table a[href="#"]');
//     console.log(`Found ${downloadLinks.length} download links`);
    
//     // Add click event listener to each link
//     downloadLinks.forEach(link => {
//         // Extract the filename (it's in a span inside the link)
//         const filenameSpan = link.querySelector('span');
//         const filenameText = filenameSpan ? filenameSpan.textContent.trim() : link.textContent.trim();
        
//         // Extract just the filename part without the file size in parentheses
//         const filename = filenameText.split(' ')[0];
//         console.log(`Processing link for file: ${filename}`);
        
//         // Add click event listener
//         link.addEventListener('click', async function(e) {
//             e.preventDefault();
            
//             // Show loading state
//             const originalHTML = link.innerHTML;
//             link.innerHTML = '<span style="color: rgb(0, 0, 0);">Loading...</span>';
//             link.style.pointerEvents = 'none';
            
//             try {
//                 console.log(`Attempting to download: ${filename}`);
                
//                 // Get file ID from Dataverse API
//                 console.log(`Fetching dataset info from DOI: ${DOI}`);
//                 const response = await fetch(`${DOMAIN}/api/datasets/:persistentId?persistentId=doi:${DOI}`);
//                 const data = await response.json();
//                 console.log("Dataset info retrieved:", data);
                
//                 // Find the file with matching label
//                 const file = data.data?.latestVersion?.files?.find(file => file.label === filename);
                
//                 if (file) {
//                     console.log(`Found file in dataset: ${JSON.stringify(file)}`);
//                     const fileId = file.dataFile.id;
//                     console.log(`File ID: ${fileId}`);
                    
//                     // Get direct download URL
//                     const downloadUrl = `${DOMAIN}/api/access/datafile/${fileId}`;
//                     console.log(`Direct download URL: ${downloadUrl}`);
                    
//                     // Create a temporary link to trigger the download
//                     const downloadLink = document.createElement('a');
//                     downloadLink.href = downloadUrl;
//                     downloadLink.target = '_blank'; // Open in new tab to handle the redirect
//                     downloadLink.download = filename;
//                     document.body.appendChild(downloadLink);
//                     downloadLink.click();
//                     document.body.removeChild(downloadLink);
                    
//                     console.log(`Download initiated for ${filename}`);
//                 } else {
//                     console.error(`File "${filename}" not found in dataset`);
//                     console.log("Available files:", data.data?.latestVersion?.files?.map(f => f.label) || []);
//                     throw new Error(`File "${filename}" not found in dataset. Check the exact filename in the Dataverse repository.`);
//                 }
//             } catch (error) {
//                 console.error('Error downloading file:', error);
//                 alert(`Error downloading ${filename}: ${error.message}`);
//             } finally {
//                 // Restore original state
//                 link.innerHTML = originalHTML;
//                 link.style.pointerEvents = 'auto';
//             }
//         });
        
//         // Add visual indication that this is a download link
//         if (filenameSpan) {
//             // Add a subtle download arrow indicator
//             link.title = "Click to download";
//             link.style.cursor = "pointer";
//         }
//     });
// });

// One-time metadata cache
let dataverseMetadata = null;

window.initDataverseDownloadLinks = async function () {
  console.log("Dataverse download script running");

  const DOMAIN = "https://archive.data.jhu.edu";
  const DOI = "10.7281/T1/JC64MK";

  async function fetchMetadataOnce() {
    if (dataverseMetadata) return dataverseMetadata;
    console.log("Fetching dataset metadata...");

    try {
      const response = await fetch(`${DOMAIN}/api/datasets/:persistentId?persistentId=doi:${DOI}`);
      if (!response.ok) {
        throw new Error(`Dataverse responded with ${response.status}`);
      }
      const data = await response.json();
      dataverseMetadata = data.data?.latestVersion?.files || [];
      console.log(`Fetched ${dataverseMetadata.length} files from Dataverse.`);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      dataverseMetadata = []; // Prevent retry flood
    }

    return dataverseMetadata;
  }

  const downloadLinks = document.querySelectorAll('a[href="#"]:not(.download-processed)');
  console.log(`Found ${downloadLinks.length} download links`);

  downloadLinks.forEach(link => {
    const filenameSpan = link.querySelector('span');
    const filenameText = filenameSpan ? filenameSpan.textContent.trim() : link.textContent.trim();
    const filename = filenameText.split(' ')[0];

    link.addEventListener('click', async function (e) {
      e.preventDefault();
      const originalHTML = link.innerHTML;
      link.innerHTML = '<span style="color: black;">Loading...</span>';
      link.style.pointerEvents = 'none';

      try {
        const files = await fetchMetadataOnce();
        const file = files.find(f => f.label === filename);

        if (!file) {
          console.error(`File "${filename}" not found in metadata`);
          alert(`File "${filename}" not found in dataset.`);
          return;
        }

        const fileId = file.dataFile.id;
        const downloadUrl = `${DOMAIN}/api/access/datafile/${fileId}`;
        const tempLink = document.createElement('a');
        tempLink.href = downloadUrl;
        tempLink.download = filename;
        tempLink.target = '_blank';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
      } catch (err) {
        console.error(`Error downloading file "${filename}":`, err);
        alert(`Error downloading file "${filename}": ${err.message}`);
      } finally {
        link.innerHTML = originalHTML;
        link.style.pointerEvents = 'auto';
      }
    });

    // Mark as processed
    link.classList.add('download-processed');

    // Style
    if (filenameSpan) {
      link.title = "Click to download";
      link.style.cursor = "pointer";
    }
  });
};