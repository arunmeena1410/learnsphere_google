require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const client = new S3Client({
  region: "auto",

  endpoint:
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY
  }
});

const bucket =
  process.env.R2_BUCKET_NAME;


// --------------------------------------------------
// FIVE PMP PDF GUIDES
// --------------------------------------------------

const pdfs = [
  "Agile Practice Guide.pdf",
  "PMBOK 6th edition.pdf",
  "PMBOK-7 infographic_A1_en.pdf",
  "PMBOK - 7.pdf",
  "PMP_Notes_Mapping_Prep2ECO.pdf"
];


// --------------------------------------------------
// UPLOAD ONE PDF
// --------------------------------------------------

async function uploadPDF(filename, number) {

  const filePath =
    path.join(
      __dirname,
      "pdfs",
      filename
    );


  if (!fs.existsSync(filePath)) {

    console.log(
      `\n❌ File not found: ${filename}`
    );

    return false;
  }


  const stats =
    fs.statSync(filePath);


  const fileSizeMB =
    (
      stats.size /
      (1024 * 1024)
    ).toFixed(2);


  console.log("\n==========================================");
  console.log(`Uploading ${number}/${pdfs.length}`);
  console.log(`File: ${filename}`);
  console.log(`Size: ${fileSizeMB} MB`);
  console.log("==========================================\n");


  try {

    const upload =
      new Upload({

        client: client,

        params: {

          Bucket: bucket,

          Key: filename,

          Body:
            fs.createReadStream(
              filePath
            ),

          ContentType:
            "application/pdf",

          CacheControl:
            "private, max-age=0, no-store"
        },

        /*
          Multipart upload settings.
          This also works safely for
          larger PDF files.
        */

        partSize:
          25 * 1024 * 1024,

        queueSize:
          2
      });


    upload.on(
      "httpUploadProgress",
      progress => {

        if (
          progress.loaded &&
          progress.total
        ) {

          const percent =
            (
              progress.loaded /
              progress.total *
              100
            ).toFixed(1);


          process.stdout.write(
            `\rProgress: ${percent}%`
          );
        }
      }
    );


    await upload.done();


    console.log(
      `\n\n✅ Successfully uploaded: ${filename}`
    );


    return true;


  } catch (error) {

    console.log(
      `\n\n❌ Upload failed: ${filename}`
    );

    console.error(
      error.message
    );

    return false;
  }
}


// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

  console.log("\n");
  console.log("==========================================");
  console.log(" Learnsphere PMP PDF Upload");
  console.log(" Cloudflare R2");
  console.log("==========================================");


  console.log(
    `\nBucket: ${bucket}`
  );


  console.log(
    `PDFs to upload: ${pdfs.length}`
  );


  let successful = 0;

  let failed = 0;


  for (
    let i = 0;
    i < pdfs.length;
    i++
  ) {

    const success =
      await uploadPDF(
        pdfs[i],
        i + 1
      );


    if (success) {

      successful++;

    } else {

      failed++;
    }
  }


  console.log("\n");
  console.log("==========================================");
  console.log(" PDF upload process finished");
  console.log("==========================================");


  console.log(
    `Successful: ${successful}`
  );


  console.log(
    `Failed: ${failed}`
  );


  console.log("==========================================\n");
}


main();