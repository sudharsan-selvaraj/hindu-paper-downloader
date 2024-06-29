function download(date, publication) {
  return fetch(
    "https://epaper.thehindu.com/ccidist-ws/th/th_coimbatore-mp/issues/88701/OPS/G36CV4QHD.1%2BG36CV4QHD.1_background-2048.png?rev=2024-06-28T16:13:02+05:30",
    { redirect: "follow" }
  ).then((res) => res.blob());
}

async function getPublications(date) {
  const response = await fetch(
    `https://epaper.thehindu.com/ccidist-ws/th/?json=true&fromDate=${date}&toDate=${date}&skipSections=true&os=web&excludePublications=*-*`
  ).then((res) => res.json());

  const publications = response?.publications?.reduce((acc, p) => {
    acc[p.id] = {
      ...p,
      url: p.issues.web[0].url,
      pageUrl: `${p.issues.web[0].url}/OPS/cciobjects.json`,
    };
    return acc;
  }, {});
  return publications;
}

function formatDate(date) {
  let year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);
  let month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
  let day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  return `${year}-${month}-${day}`;
}

function convertBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

$(function () {
  $("#datepicker").datepicker({
    showOtherMonths: true,
  });

  $("#download").on("click", async () => {
    const date = formatDate($("#datepicker").datepicker("getDate"));
    const publicationId = $("#publication").find(":selected").val();
    const publications = await getPublications(date);
    const publication = publications[publicationId];
    const content = await fetch(publication.pageUrl).then((res) => res.json());

    $("#message").html("Getting Page details....");

    const images = [];
    let index = 1;
    for (const c of content.children) {
      const id = c.id;
      const url = `${publication.url}OPS/${encodeURIComponent(
        id + "+" + id
      )}_background-2048.png`;
      $("#message").html(
        `Downloading image for page ${index++} of total pages ${
          content.children.length
        }`
      );
      const blob = await fetch(url)
        .then((res) => res.blob())
        .then(convertBlobToBase64);
      images.push(blob);
    }

    var doc = new window.jspdf.jsPDF("p", "mm", "a4");

    var width = doc.internal.pageSize.getWidth();
    var height = doc.internal.pageSize.getHeight();

    images.forEach((image, index) => {
      doc.addImage(image, "PNG", 0, 0, width, height);
      if (index < images.length - 1) {
        doc.addPage();
      }
    });

    doc.save(`${publicationId}_${date}_hindu.pdf`);
  });
});
