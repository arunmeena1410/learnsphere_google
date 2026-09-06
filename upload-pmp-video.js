require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");


// ==================================================
// CLOUDFLARE R2 CONNECTION
// ==================================================

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


// ==================================================
// R2 BUCKET
// ==================================================

const bucket =
  process.env.R2_BUCKET_NAME;


// ==================================================
// VIDEOS TO UPLOAD
// ==================================================

const videos = [

  "pmp-exam-introduction-and-overview.mp4",

  "pmp-exam-passing-score-and-exam-report.mp4",

  "pmp-exam-content-outline.mp4",

  "pmbok-guide-overview.mp4",

  "pmbok-guide-principles-1.mp4",

  "pmbok-guide-principles-2.mp4",

  "pmbok-guide-principles-3.mp4",

  "pmbok-guide-performance.mp4",

  "pmbok-guide-performance-domains.mp4",

  "agile-manifesto.mp4",

  "pmp-exam-mindset-part-1.mp4",

  "pmp-exam-mindset-part-2.mp4",

  "pmp-exam-mindset-part-3-exam-taking.mp4",

  "certification-renewal-and-pdus.mp4",

  "pmp-exam-lessons-learned-dana-domnisor.mp4",

  "pmp-exam-lessons-learned-sudip-roy.mp4"

];


// ==================================================
// UPLOAD ONE VIDEO
// ==================================================

async function uploadVideo(filename, number) {

  const filePath =
    path.join(
      __dirname,
      "videos",
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


  const fileSizeGB =
    (
      stats.size /
      (1024 * 1024 * 1024)
    ).toFixed(2);


  console.log("\n==========================================");

  console.log(
    `Uploading ${number}/${videos.length}`
  );

  console.log(
    `File: ${filename}`
  );

  console.log(
    `Size: ${fileSizeGB} GB`
  );

  console.log("==========================================\n");


  try {

    const upload =
      new Upload({

        client: client,

        params: {

          Bucket:
            bucket,

          Key:
            filename,

          Body:
            fs.createReadStream(
              filePath
            ),

          ContentType:
            "video/mp4",

          CacheControl:
            "private, max-age=0, no-store"

        },


        // Multipart upload settings.
        // This allows large videos
        // to be uploaded in parts.

        partSize:
          100 * 1024 * 1024,

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


// ==================================================
// UPLOAD ALL VIDEOS
// ==================================================

async function main() {

  console.log("\n");
  console.log("==========================================");
  console.log(" Learnsphere PMP Video Upload");
  console.log(" Cloudflare R2");
  console.log("==========================================");

  console.log(
    `\nBucket: ${bucket}`
  );

  console.log(
    `Videos to upload: ${videos.length}`
  );


  let successful =
    0;

  let failed =
    0;


  for (
    let i = 0;
    i < videos.length;
    i++
  ) {

    const success =
      await uploadVideo(
        videos[i],
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
  console.log(" Upload process finished");
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