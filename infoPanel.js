const infoPanel = document.getElementById("info-panel");
const infoCloseBtn = document.getElementById("close-btn");

const infoImage = document.getElementById("info-image");
const infoPlaceName = document.getElementById("info-place");
const infoDesc = document.getElementById("info-desc");
const gmapsBtn = document.getElementById("gmaps-button");


var photosphere = document.getElementById("photosphere");
var vrScene = document.getElementById("vrScene");
var vrClose = document.getElementById("vr-close-btn");
vrScene.style.display = "none";

function openPanel(location)
{

    /* Close the panel if it's already visible for a better transition */
    if(infoPanel.classList.contains("open"))
    {
        closePanel(false);
        setTimeout(() => {
            openPanel(location);
        }, 600);
        return;
    }

    infoImage.src = location.image;
    infoPlaceName.textContent = location.title;
    infoDesc.textContent = location.description;

    console.log("isPanorama:", location._panoramaDetection.isPanorama);

    if(location._panoramaDetection.isPanorama == true)
    {
        infoImage.classList.add("openable-panorama");

        infoImage.addEventListener('click', () => 
        {
            photosphere.setAttribute('src', location.image);
            infoPanel.classList.remove('open');
            vrScene.style.display = "block";
        });

        vrClose.addEventListener('click', () =>
        {
            infoPanel.classList.add('open');
            vrScene.style.display = "none";
        });

    }

    if("gmaps_url" in location)
    {
        gmapsBtn.style.display = "block";

        gmapsBtn.href = location.gmaps_url;
        gmapsBtn.target = "_blank";
    }
    else
    {
        gmapsBtn.style.display = "none";
    }

    infoCloseBtn.addEventListener('click', closePanel);

    infoPanel.classList.add("open");
}

function closePanel(resetMarker = true)
{
    infoPanel.classList.remove('open');

    if (resetMarker && currentlySelectedMarker) {
        currentlySelectedMarker.setIcon(defaultPin);
        currentlySelectedMarker = null;
    }

}