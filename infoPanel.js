const infoPanel = document.getElementById("info-panel");
const infoCloseBtn = document.getElementById("close-btn");

const infoImage = document.getElementById("info-image");
const infoPlaceName = document.getElementById("info-place");
const infoDesc = document.getElementById("info-desc");
const gmapsBtn = document.getElementById("gmaps-button");

function openPanel(location)
{

    /* Close the panel if it's already visible for a better transition */
    if(infoPanel.classList.contains("open"))
    {
        closePanel();
        setTimeout(() => {
            openPanel(location);
        }, 500);
        return;
    }

    infoImage.src = location.image;
    infoPlaceName.textContent = location.title;
    infoDesc.textContent = location.description;

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

function closePanel()
{
    infoPanel.classList.remove('open');
}