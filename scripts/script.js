/*
    
    @TODO
    - Rewrite Settings
    - Rewrite Changelog
    - Rewrite weather
    - How the fuck is the code so bad?

*/


import 'regenerator-runtime/runtime'
import utils from './utils.js'
import ClipboardJS from 'clipboard'
import { async } from 'regenerator-runtime/runtime';
const unsplashKey = "S_BD1M0Oo6ZisUI3ABtJ07ioJ03RgVqzBgy7iscfqIo"
// please no steal






    // // Localization:
    // const localizify = require('localizify');
    // const defaultLocale = localizify.getDefaultLocale()
    //     const it = require('../assets/locales/it.json')
    //     const en = require('../assets/locales/en.json')
    //     const es = require('../assets/locales/es.json')
    //     const fr = require('../assets/locales/fr.json')
    //     const de = require('../assets/locales/de.json')

    //     localizify.add('it', it).add('en', en).add('es', es).add('fr', fr).add('de', de)
    //     localizify.setDefaultLocale(defaultLocale)


const earthview = require("../assets/earthview.json");
const localChangelog = require("../assets/changelog.json")
const serverChangelog = utils.fetchChangelog().then(data => data)

let wallpaperUrl = null
let isPopupOpen = false;
let wpLoading = false;
window.version = localChangelog.version
let accentColor;





document.addEventListener('DOMContentLoaded', async() => {
    

    // Date initialization
    document.getElementById("date").innerHTML = "" + generateDate(new Date())
    document.getElementById("clock").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    
    // Add Event Listener for the popup (if the user clicks outside the popup, close it)
    document.getElementById("popupManager").addEventListener('click', async function(e){
        if(e.target.id == "popupManager"){
            closePopup()
        } 
    })
    
    
    // Load everything
    try{
        utils.updateTitle();
        await setFavPosition(localStorage.getItem("favoritesMode") || "bottom");
        await setTheme();
        await setAccent();
        updateWeather();
        await setWallpaper(localStorage.getItem("unsplashCategory") || "nature"); 
    } catch(e) {
        console.error(`Something went wrong!\n${e}`)
    }
    
    document.getElementById("wallpaper").style.transform = "scale(1.05)"
    
    // clock
    let clockTick = setInterval(async function() {
        document.getElementById("date").innerHTML = "" + generateDate(new Date())
        document.getElementById("clock").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        document.title = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " | New Tab"
    }, 1000)
    
    let minUpdateCycle = setInterval(async function(){
        utils.updateTitle();
        if(!document.getElementsByClassName("weatherWrapper").display == "none" ||!document.getElementsByClassName("weatherWrapper").display == ""){
            updateWeather(geoLoc);
        } else {
            clearInterval(updateWeather);
        } 
    }, 60000)
})




window.updateWeather = async function(place, units){
    try{   
        if(!place){
            place = "London"
        }
        if(!units) units = "metric"
        const baseUrl = "https://api.openweathermap.org/data/2.5/weather?q="
        const apiKey = "128b2a70fd3d8d83854ae6d95ec1a1eb"
        
        // fetch the weather data
        let weatherData = await fetch(`${baseUrl}${encodeURIComponent(place)}&appid=${apiKey}&units=${units}&lang=${settings.language}`)
        weatherData = await weatherData.json()
        if(weatherData.cod){

            switch(weatherData.cod){
                case "404":
                    console.error("[!] City not found")
                    settings.location = "auto"
                    return

                case "401":
                    console.error("[!] Invalid API key")
                    return

                case "400":
                    console.error("[!] Bad request")
                    return
            }
        }

        // format the weather data
        let data = {
            temp: weatherData.main.temp,
            location: weatherData.name,
            icon: weatherData.weather[0].icon,
            description: weatherData.weather[0].description
        }

        // generate the icon url
        let iconUrl = `https://openweathermap.org/img/wn/${data.icon}.png`
        document.getElementById("weatherIcon").src = iconUrl
        document.getElementById("weatherIcon").alt = data.description
        document.getElementById("weatherIcon").title = data.description

        document.getElementById("weatherTemp").innerHTML = data.temp + "°C"
        document.getElementById("weatherLocation").innerHTML = "&nbsp;" + data.location
        document.getElementsByClassName("weatherWrapper")[0].style.display = "block"
        await wait(100)
        document.getElementById("weatherInfo").style.opacity = 1
        document.getElementsByClassName("weatherWrapper")[0].style.opacity = 1
    } catch(e) {
        console.error(`Something went wrong!\n${e}`)
    }
}   

window.fetchLocation = async function(){
    if(navigator.geolocation){
        await navigator.geolocation.getCurrentPosition(async(position) => {
            let lat = position.coords.latitude
            let lon = position.coords.longitude
            geoLoc = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=128b2a70fd3d8d83854ae6d95ec1a1eb`)
            geoLoc = await geoLoc.json()
            console.log(geoLoc)
            geoLoc = await geoLoc[0].name
            updateWeather(geoLoc)

            // if the permission is denied, we'll just use the default location
        }, async(error) => {
            console.error(`[!] ${error.message}`)
            updateWeather("London")
        })
    } else {
        console.error("[!] Couldn't fetch Geolocation")
        updateWeather("London")
    }
}

window.generateDate = function(date) {
    // date is the timestamp

    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    let daySuffixes = ["st", "nd", "rd", "th"]

    date = new Date(date)
    
    // generate the suffix (1st, 2nd, 3rd, etc.)
    let daySuffix = daySuffixes[(date.getDate() - 1) % 10]
    if(daySuffix == undefined){
        daySuffix = "th"
    }

    return `${months[date.getMonth()]} ${date.getDate()}${daySuffix}, ${date.getFullYear()}`
}

window.closePopup = async function(item){
    document.getElementById("wallpaper").style.transform = "scale(1.05)"
    
    let popupIndex = -1
    for(let i = 0; i < document.getElementsByClassName("popup").length; i++){
        if(document.getElementsByClassName("popup")[i].style.display != "none" || !document.getElementsByClassName("popup")[i].style.display){
            popupIndex = i
        }
    }

    if(popupIndex == -1){
        document.getElementsByClassName("popup-background")[0].style.opacity = 0
        await wait(200)
        document.getElementsByClassName("popup-background")[0].style.display = "none"
        isPopupOpen = false
        document.getElementById("wallpaper").style.transform = "scale(1.05)"
        return console.warn("[!] No popup to close")    
    }

 
    console.log("[*] Closing popup with id. " + popupIndex)
    item = document.getElementsByClassName("popup")[popupIndex]

    item.style.opacity = 0
    item.style.transform = "scale(0.9)"

    await wait(100)
    item.parentElement.style.opacity = 0;
    await wait(500);
    item.style.display = "none"
    // hide the parent
    item.parentElement.style.display = "none"
    isPopupOpen = false

}

window.openPopup = async function(popupType){
    console.log("Recived request for opening the " + popupType + " popup")
    for(let i = 0; i < document.getElementsByClassName("popup").length; i++){
        if(document.getElementsByClassName("popup")[i].style.display != "none" || !document.getElementsByClassName("popup")[i].style.display){
            document.getElementsByClassName("popup")[i].style.opacity = 0
            document.getElementsByClassName("popup")[i].style.transform = "scale(0.9)"
            await wait(500)
            document.getElementsByClassName("popup")[i].style.display = "none"
        } else {
            document.getElementsByClassName("popup")[i].style.display = "none"
        }
    }

    console.log("Hid all popups")

    
    // create the new popup
    switch(popupType){
        case "updates":
            console.log("[*] Opening the updates popup")
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1
            document.getElementById("wallpaper").style.transform = "scale(1)"

            await checkForUpdates()
            // load the changelog 
            document.getElementById("betaBadge").innerHTML = localChangelog.version + " • " + localChangelog.date
            document.getElementById("cl-descContent").innerHTML = localChangelog.description.replace(/\n/g, "<br>")


            if(localChangelog.changes.length > 0){
                let changesList = document.getElementById("cl-updates")
                changesList.innerHTML = ""
                for(let i = 0; i < localChangelog.changes.length; i++){
                    let change = `<b>${localChangelog.changes[i].title}</b><br>${localChangelog.changes[i].description.replace(/\n/g, "<br>")}<br>`
                    if(i != localChangelog.changes.length - 1){
                        change+= "<br>";
                    }

                    let changeItem = document.createElement("li")
                    changeItem.innerHTML = change
                    changesList.appendChild(changeItem)
                }
            } else {
                document.getElementById("cl-updates").style.display = "none"
            }
            
            if(!localChangelog.notice){
                document.getElementById("cl-notice").style.display = "none"
            } else {
                document.getElementById("cl-notice").innerHTML = localChangelog.notice
            }
            
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1

            
            
            document.getElementById("about").style.display = "block"
            console.log("[*] Set the display of the about popup to block")
            document.getElementById("about").style.transform = "scale(1)"
            document.getElementById("about").style.opacity = 1
            break;
            
            case "settings":
                    document.getElementsByClassName("popup-background")[0].style.display = "grid"
                for(let i = 0; i < document.getElementsByClassName("tab").length; i++){
                    document.getElementsByClassName("tab")[i].style.display = "none"
                }
                egg = 0;
                switchSettingsTab("general")
                await wait(100)
                document.getElementsByClassName("popup-background")[0].style.opacity = 1


                document.getElementById("settings").style.display = "block"
                document.getElementById("settings").style.transform = "scale(1)"
                document.getElementById("settings").style.opacity = 1
            break
            
            case "about":
                document.getElementsByClassName("popup-background")[0].style.display = "grid"
                await wait(100)
                document.getElementsByClassName("popup-background")[0].style.opacity = 1

                document.getElementById("about").style.display = "block"
                document.getElementById("about").style.transform = "scale(1)"
                document.getElementById("about").style.opacity = 1
            break
            
            default:
                console.warn("Couldn't find the requested popup!")
                closePopup()
                break
            }
            
            document.getElementById("wallpaper").style.transform = "scale(1)"
    
    // show the popup
    let popup = document.getElementsByClassName("popup")[0]
    popup.style.opacity = 1
    popup.style.transform = "scale(1)"
    isPopupOpen = true
    
}

window.wait = async function(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}


window.checkForUpdates = async function(source){
    /* TODO 
        - Notifications
        - Errors
        - Automatic updates
    */

    console.log("[*] Checking for updates")

    let button;
    if(source == "SettingsAbout"){
        document.getElementById("updateInfo").style.opacity = 0;
        // get the button
        button = document.getElementsByClassName("btn_checkForUpdates")[0]
        
        // set the id to btn_updates-checking
        button.id = "btn_updates-checking"
        button.disabled = true
    }
    
    await wait(500)
    let newChangelog = await utils.fetchChangelog()
    
    if(newChangelog == false){
        if(source == "SettingsAbout"){
            button.disabled = false
            button.id = "btn_updates"
            document.getElementById("updateInfo").style.color = "#f00"
            document.getElementById("updateInfo").innerHTML = `Couldn't check for updates.`
            document.getElementById("updateInfo").style.opacity = 1;
            return
        }
    }
    if(newChangelog.versionId != localChangelog.versionId){
        console.log("[*] Server Version: " + newChangelog.versionId)
        console.log("[*] Local Version: " + localChangelog.versionId)
        if(localChangelog.versionId < newChangelog.versionId){
            // it's out of date
            console.log("[*] There's a new update available" + `(${localChangelog.version} | ${localChangelog.versionId} -> ${newChangelog.version} | ${newChangelog.versionId})`)
            document.getElementById("err-description").innerHTML = `There's a new build of CastView available for download!`
            if(source == "SettingsAbout"){
                button.disabled = false
                button.id = "btn_updates"
                document.getElementById("updateInfo").style.color = "#137C13"
                document.getElementById("updateInfo").innerHTML = `Update available!`
                document.getElementById("updateInfo").style.opacity = 1;

            }
            return true
        } else {
            document.getElementById("err-description").innerHTML = `You are using a developer build, something probably went (very) wrong!`
            if(source == "SettingsAbout"){
                button.disabled = false
                button.id = "btn_updates"
                document.getElementById("updateInfo").style.color = "red"
                document.getElementById("updateInfo").innerHTML = `You are using a developer build!`
                document.getElementById("updateInfo").style.opacity = 1;
            }
            return true
        }
        
    } else {
        console.log("[*] Everything is up to date!")
        document.getElementById("cl-error").style.display = "none"

        if(source == "SettingsAbout"){
            button.disabled = false;
            button.id = "btn_updates"
            document.getElementById("updateInfo").style.color = "#137C13"
            document.getElementById("updateInfo").innerHTML = `No updates available!`
            document.getElementById("updateInfo").style.opacity = 1;
        }
        return false
    }
}



// SETTINGS
window.setLanguage = async function(language){
    if(!availableLanguages.includes(language)){
        console.warn("[!] The requested language is not available")
        return
    } else if(language == settings.language){
        console.log("[*] The requested language is already set")
        return
    } else {
        if(language == "default"){
            language = globalLanguage;
        }
        // set the class of the item with the class "checkbox"
        let checkboxes = document.getElementsByClassName("checkbox")
        for(let i = 0; i < checkboxes.length; i++){
            checkboxes[i].classList.remove("checkbox--selected")
        }

        document.getElementById(`${language}`).classList.add("checkbox--selected")
        
        localStorage.setItem("language", language)
        settings.language = language
        document.getElementById("date").style.opacity = 0;
        document.getElementById("date").innerHTML = "" + generateDate(new Date())
        document.getElementsByClassName("weather-location")[0].style.opacity = 0;
        document.getElementById("clockString").innerHTML = await new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        document.getElementsByClassName("weather-location")[0].style.opacity = 1;
        document.getElementById("date").style.opacity = 1;
    }
};

window.toggleDarkMode = function(theme){
    if(theme == null){
        // console.log("Before:" + darkMode)
        // theme = document.getElementById("darkModeCheckbox").checked
        theme = false;
        // theme = settings.darkMode
        // console.log("After:" + darkMode)
        console.log("[!] No theme specified, switched to " + theme)
    } 
    
    
    let documentVariables = document.documentElement.style
    if(theme == true){
        documentVariables.setProperty("--background-color", "30, 30,30")
        documentVariables.setProperty("--shade-color", "30,30,30")
        documentVariables.setProperty("--item-color", "46,46,46")
        documentVariables.setProperty("--highlight", "54,54,54")
        documentVariables.setProperty("--text-color", "205,205,205")
        documentVariables.setProperty("--text-selected", "255,255,255")
        documentVariables.setProperty("--popup-warning-bg", "54, 54, 54")
        documentVariables.setProperty("--popup-warning-text", "255, 255, 255");
        documentVariables.setProperty("--popup-green-bg", "54, 54, 54");
        documentVariables.setProperty("--popup-green-text", "255, 255, 255");
        documentVariables.setProperty("--popup-error-bg", "54, 54, 54");
        documentVariables.setProperty("--popup-error-text", "255,255,255")
    } else {
        documentVariables.setProperty("--background-color", "245,245,245")
        documentVariables.setProperty("--shade-color", "150,150,150")
        documentVariables.setProperty("--item-color", "225,225,225")
        documentVariables.setProperty("--highlight", "220,220,220")
        documentVariables.setProperty("--text-color", "33,33,33")
        documentVariables.setProperty("--text-selected", "0,0,0")
        documentVariables.setProperty("--popup-warning-bg", "236, 225, 129")
        documentVariables.setProperty("--popup-warning-text", "124, 117, 19")
        documentVariables.setProperty("--popup-green-bg", "181, 241, 181")
        documentVariables.setProperty("--popup-green-text", "19, 124, 19")
        documentVariables.setProperty("--popup-error-bg", "236, 68, 68")
        documentVariables.setProperty("--popup-error-text", "255,255,255")
    }

    localStorage.setItem("darkMode", settings.darkMode)
}

let tries = 0
window.setWallpaper = async function(provider){
    // set the classname to fa-spin
    if(wpLoading){
        console.log("[!] The wallpaper is already being refreshed")
        return
    }


    wpLoading = true
    document.getElementById("wallpaper").style.transform = "scale(1.1)"
    document.getElementById("wallpaper").style.filter = "saturate(0)"
    
    let wallpaper;
    let image;

    try{
        tries++        
        if(provider){
            localStorage.setItem("unsplashCategory", provider)
        }


        document.getElementsByClassName('background')[0].style.opacity = 1;
        // document.getElementsByClassName("credits")[0].style.height = "0px";
        await wait(600)
        unsplashCategories = [
            "nature",
            "architecture",
            "patterns",
            "mountains",
            "wallpapers",
            "experimental",
            "aurora"
        ]

        if(!provider){
            provider = localStorage.getItem("unsplashCategory")
        }

        if(!unsplashCategories.includes(provider)){
            return console.warn("[!] The requested category is not available ( Requested provider: ", provider, ")")
        }


        if(!localStorage.getItem("unsplashCategory")){
            localStorage.setItem("unsplashCategory", "architecture")
        }
            // use unsplash source to get a random image from the selected category
            try{
                let unsplashResult = await fetch(`https://api.unsplash.com/photos/random?orientation=landscape&per_page=1&collection_id=${localStorage.getItem("aurora")}&client_id=${unsplashKey}`)
                let unsplashData = await unsplashResult.json()
                console.log("[*] Using unsplash as wallpaper", unsplashData)
                document.getElementById("wallpaper").style.background = "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent, rgba(0,0,0,0.7)), url(" + unsplashData.urls.small + ")"   
                wallpaper = unsplashData.urls.full
                document.getElementById("wallpaper-author").innerHTML = `<a href="${unsplashData.user.links.html}" target="_blank">${unsplashData.user.name}</a>`
            } catch(e){
                console.error("[!] Error while fetching from unsplash", e)
                wallpaper = "https://source.unsplash.com/collection/architecture?sig=" + Math.random()
        }

        // Reset the attempts
        tries = 0


        } catch(e) {
            if(tries < 10){
                setWallpaper(localStorage.getItem('unsplashCategory'));
                console.warn("[Wallpaper] Something went wrong while trying to fetch the wallpaper, skipping... [Attempt " + tries + "]\n" + e)
            } else {
                console.error("[Wallpaper] Couldn't connect to the server")
                console.log(e)
            }
        }



        if(wallpaper){
            image = new Image()
            image.src = wallpaper
            image.onload = function(){
                document.getElementById("wallpaper").style.background = "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent, rgba(0,0,0,0.7)), url(" + wallpaper + ")"        
                document.getElementsByClassName('background')[0].style.opacity = 0;
                // document.getElementsByClassName("credits")[0].style.opacity = 1;
                // document.getElementsByClassName("credits")[0].style.height = "20px";
            }
        }

        // wait for the image to load
        await wait(500)        
        document.getElementById("wallpaper").style.transform = "scale(1.05)"
        document.getElementById("wallpaper").style.filter = "saturate(1)"
        let showcases = document.getElementsByClassName("showcase");

     

        let avgColor = await utils.getAverageColor(wallpaper)
        console.log("[*] Average color: " + avgColor.hex)
        document.documentElement.style.setProperty("--background-accent", avgColor.hex)
        accentColor = avgColor.hex

        for(let i = 0; i < showcases.length; i++){
            showcases[i].style.backgroundColor = avgColor.hex
        }
        await wait(2000)
        wpLoading = false
    }


    window.setLocation = async function(location){
        if(!location){
            location = "auto"
            console.warn("[!] The requested location is not available")
        }

        localStorage.setItem("location", location)
        settings.location = location
        document.getElementsByClassName("weather-location")[0].style.opacity = 0;
        await updateWeather(location);
        document.getElementsByClassName("weather-location")[0].style.opacity = 1;
    }


    let egg = 0;
    let eggTriggered = false;
    window.switchSettingsTab = async function(tabName){
        try{

            let availableTabs = [
                "general",
                "customization",
                "language",
                "advanced",
                "about",
                "secrets",
                "error"
            ]


            if(!tabName){
                tabName = "general"
                console.warn("[!] Cannot switch to the requested tab (NO_TAB_REQUESTED)")
            }

            if(!availableTabs.includes(tabName)){
                console.warn("[!] Cannot switch to the requested tab (NOT_AVAILABLE)")
                return
            }



            // check if the tab is already open
            if(document.getElementById(`tab-${tabName}`).style.display == "block"){
                if(tabName == "about"){
                    egg++

                    if(!eggTriggered){
                        await shakeElement(document.getElementById("menuItem-about"), egg)
                    }

                    if(egg == 10 && !eggTriggered){
                        egg = 0
                        eggTriggered = true
                        document.getElementById("settings-menu").innerHTML += `<div class="settings-menuItem" id="menuItem-secrets" style="opacity: 0; transform: scale(0.5)" onclick="switchSettingsTab('secrets')"><i class="fas fa-star"></i> <span>Secrets</span></div>`
                        await wait(100)
                        document.getElementById("menuItem-secrets").style.opacity = 1;
                        document.getElementById("menuItem-secrets").style.transform = "scale(1)"
                        // await shakeElement(document.getElementById("settings"), 10, true)
                    }
                } else {
                    if(!eggTriggered){
                        egg = 0;
                    }
                }
                return
            }

            // remove the class for all the menu items with the class "settings-menuItem--selected"
            let menuItems = document.getElementsByClassName("settings-menuItem")
            for(let i = 0; i < menuItems.length; i++){
                menuItems[i].classList.remove("settings-menuItem--selected")
            }

            // set the class of the menu item to settings-menuItem--selected
            document.getElementById(`menuItem-${tabName}`).classList.add("settings-menuItem--selected")

            if(tabName == "language"){
                // get the language from the local storage
                let language = localStorage.getItem("language")
                if(!language){
                    language = "en"
                }

                settings.language = language

                // set the class of the item with the class "checkbox"
                let checkboxes = document.getElementsByClassName("checkbox")
                for(let i = 0; i < checkboxes.length; i++){
                    checkboxes[i].classList.remove("checkbox--selected")
                }

                document.getElementById(`${language}`).classList.add("checkbox--selected")
            
            } else if(tabName == "about"){
                document.getElementById("version").innerHTML = localChangelog.version 
            }


        

            document.getElementById("settings-content").style.opacity = 0;
            document.getElementById("settings-content").style.transform = "scale(0.95)"

            await wait(200);
            // do stuff here

            // hide all the tabs but the one we want to show
            let tabs = document.getElementsByClassName("tab")
            for(let i = 0; i < tabs.length; i++){
                tabs[i].style.display = "none"
            }

            // show the tab we want to show
            document.getElementById(`tab-${tabName}`).style.display = "block"



            document.getElementById("settings-content").style.opacity = 1;
            document.getElementById("settings-content").style.transform = "scale(1)"
        } catch(e){
            console.error(e)
            // switchSettingsTab("error")\
        }
    }

    window.shakeElement = async function(element, intensity, complete){
        if(!intensity){
            intensity = 10
        }

        element.style.transition = "transform 0s"
        for(let i = 0; i < 10; i++){
            if(complete){
                element.style.transform = "translate(" + ((Math.random() * (1 - (-1) + 1) + (-1)) * (intensity))  + "px," + ((Math.random() * (1 - (-1) + 1) + (-1)) * (intensity)) + "px)"
            } else {
                element.style.transform = "translate(" + ((Math.random() * (1 - (-1) + 1) + (-1)) * (intensity))  + "px, 0px)"  
            }
            await wait(10)
        }
        element.style.transform = "translate(0px, 0px)"
    }


    
    document.addEventListener('keydown', async function(e){
        if(e.key == "Escape"){
            if(document.getElementsByClassName("ctxMenu")[0].id == "ctxm-show"){
                document.getElementsByClassName("ctxMenu")[0].id = "ctxm-hidden"
            }
            if(isPopupOpen) closePopup()
        }
    })
    
    window.showRightClickMenu = async function(context, dev){
        if(!dev) dev = false
        console.log(context)
        let item = context.target
        // P.S. The Icons are from material design icons
        let contextOptions = [
            {
                context: "generic",
                options: [
                    {
                        name: "Developer Console",
                        icon: "terminal",
                        action: "toggleConsole()", // placeholder
                        type: "button",
                        dev: true,
                    },
                    {
                        name: "Refresh background",
                        icon: "refresh",
                        action: "setWallpaper()",
                        type: "button",
                    },
                    {
                        type: "separator",
                    },
                    {
                        name: "Settings",
                        icon: "settings",
                        action: "openPopup('settings')",
                        type: "button",
                    },
                    {
                        name: "About",
                        icon: "info_outline",
                        action: "openPopup('about')",
                    },
                ],
            },
            {
                context: "clock",
                options: [
                    {
                        name: "Change Format",
                        icon: "access_time",
                        action:"",
                        type: "button",
                    },
                    {
                        type: "separator",
                    },
                    {
                        name: "Settings",
                        icon: "settings",
                        action: 'openPopup("settings")',
                        type: "button",
                    },
                    {
                        name: "About",
                        icon: "info_outline",
                        action: 'openPopup("about")',
                        type: "button",
                    },
                ],
            },
            {
                context: "weather",
                options: [
                    {
                        name: "Change Location",
                        icon: "location_city",
                        action: "",
                        type: "button",
                    },
                    {
                        name: "Change Units",
                        icon: "swap_horiz",
                        action: "",
                        type: "button",
                    },
                    {
                        type: "separator",
                    },
                    {
                        name: "Settings",
                        icon: "settings",
                        action: "openPopup('settings')",
                        type: "button",
                    },
                    {
                        name: "About",
                        icon: "info_outline",
                        action: "openPopup('about')",
                        type: "button",
                    },
                ],
            },
            {
                context: "text",
                options: [
                    {
                        name: "Copy",
                        icon: "content_copy",
                        // copy to clipboard the text selected
                        action: "document.execCommand('copy')", 
                        type: "button",
                    },
                    {
                        name: "Paste",
                        icon: "content_paste",
                        // paste the text from the clipboard
                        action: "document.execCommand('paste')",
                        type: "button",
                    },
                    {
                        name: "Cut",
                        icon: "content_cut",
                        // cut the text selected
                        action: "document.execCommand('cut')",
                        type: "button",
                    },
                    {
                        type: "separator",
                    },
                    {
                        name: "Settings",
                        icon: "settings",
                        action: "openPopup('settings')",
                        type: "button",
                    },
                    {
                        name: "About",
                        icon: "info_outline",
                        action: "openPopup('about')",
                        type: "button",
                    },
                ],
            }
        ]

        // get the item that was clicked
        

        console.log(item)
        
        // if the user rightclicks #popupManager or any of the children (or sub-children) of it
        if(context.target.matches("#popupManager, #popupManager *")){
            return
        }




        let itemsReq;
        switch(item.id){
            case "clock":
                itemsReq = contextOptions[1].options
                break;
            case "weather":
                itemsReq = contextOptions[2].options
                break;
            case "credits":
                itemsReq = contextOptions[3].options
                break;
            case "spotlightSearch":
                // itemsReq = contextOptions[4].options


            default:
                itemsReq = contextOptions[0].options
                break;
        }
        
        if(!itemsReq){
            return;
        }

        // create the menu
        document.getElementsByClassName("ctxMenu")[0].innerHTML = ""
        for(let i = 0; i < itemsReq.length; i++){
            let item = itemsReq[i]
            if(item.type == "separator"){
                document.getElementsByClassName("ctxMenu")[0].innerHTML += `<div class="ctx-separator"></div>`
            } else {
                if(item.dev && !dev){
                    continue
                }
                document.getElementsByClassName("ctxMenu")[0].innerHTML += `
                <div class="ctx-item" id="ctxItem-${item.name}" data-type="${item.type}" onclick="${item.action}">
                    <i class="material-icons">${item.icon}</i>
                    &nbsp;
                    <span>${item.name}</span>
                </div>
                `
            }
        }

        let menu = document.getElementsByClassName("ctxMenu")[0]
        menu.id = "ctxm-show"
        menu.style.display = "block"
        // if the menu is outside the screen, move it to the right
        console.log(menu.getBoundingClientRect().right)
            menu.style.left = context.clientX - 2 + "px"
            if(menu.getBoundingClientRect().right > window.innerWidth){
                menu.style.left = (window.innerWidth - menu.getBoundingClientRect().width - 10) + "px"
            }
        // }
        menu.style.top = context.clientY + "px"

        // if the menu is outside the screen, move it to the bottom
        console.log(menu.getBoundingClientRect().bottom)
        console.log(window.innerHeight)
        console.log(menu.getBoundingClientRect().bottom + 100 > window.innerHeight)
        if(menu.getBoundingClientRect().bottom + 100 > window.innerHeight){
            menu.style.top = (context.clientY - menu.getBoundingClientRect().height - 125) + "px"
        }
    }

    // right click
    document.addEventListener('contextmenu', async function(e){
        if(e.shiftKey){
            return true
        }
        e.preventDefault()
        let menu = document.getElementsByClassName("ctxMenu")[0]
        // if the user right clicks the menu or any of its children, don't show the menu
        if(e.target.classList.contains("ctxMenu") || e.target.classList.contains("ctx-item")){
            return
        } else {
            menu.id = "ctxm-hidden"
            await wait(200)
            if(e.ctrlKey){
                showRightClickMenu(e, true)
            } else {
                showRightClickMenu(e, false)
            }
        }
    })

    document.addEventListener('click', function(e){
        // check if ctxMenu or one of its children was clicked
        let menu = document.getElementsByClassName("ctxMenu")[0]
        if(!e.target.classList.contains("ctxMenu")){
            menu.id = "ctxm-hidden"
        }
    })


window.copyToClipboard = function(text){
    console.log(text)
    // decode from base64
    text = atob(text)
    // use clipboard API
    navigator.clipboard.writeText(text)
}


window.setAccent = function(name){
    // check if there's a div with the id of color-[name]
    //if the color is the same as the current color, don't do anything
    if(name == localStorage.getItem("accent")){
        return
    }


    if(!name){
        name = localStorage.getItem("accent")
    }

    if(!document.getElementById(`color-${name}`)){
        console.error("[!] No color found with that name")
        return false
    }

    // get the hex
    let hex = document.getElementById(`color-${name}`).style.backgroundColor
    
    if(!hex){
        if(name == "auto"){
            hex = accentColor
            document.documentElement.style.setProperty("--theme-color", hex)
        } else {
            console.error("[!] No color found with that name")
            return false
        }
    } else {
        document.documentElement.style.setProperty("--theme-color", hex)
    }

    console.log(`[*] Accent set to ${hex}, ${name}`)
    
    let selected = document.querySelector(`[data-selected="true"]`)
    selected.removeAttribute("data-selected")
    
    let selectedAccent = document.getElementById(`color-${name}`)
    selectedAccent.setAttribute("data-selected", "true")
    localStorage.setItem("accent", name)
}


window.setTheme = function(theme){
    console.log("[*] Theme set to " + theme)

    if(!theme){
        if(!localStorage.getItem('theme')){
            localStorage.setItem('theme', 'auto')
        }
        theme = localStorage.getItem('theme')
    }


    switch(theme){
        case 'light':
            localStorage.setItem('theme', 'light')
            toggleDarkMode(false)
            break
        
        case 'dark':
            localStorage.setItem('theme', 'dark')
            toggleDarkMode(true)
            break

        case 'auto':
            localStorage.setItem('theme', 'auto')
            if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
                toggleDarkMode(true)
            } else {
                toggleDarkMode(false)
            }
            break
    }

    // get the 3 .box items, and remove the attribute from the one that has the data-selected attribute
    let boxes = document.getElementsByClassName("box")
    for(let i = 0; i < boxes.length; i++){
        boxes[i].removeAttribute("data-selected")
    }


    // set the selected attribute to the one that has the same name as the theme
    let selected = document.getElementById(`${theme.toLowerCase()}Mode`)
    console.log(selected)
    selected.setAttribute("data-selected", "true")

}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if(localStorage.getItem('theme') == 'auto'){
        if(event.matches){
            toggleDarkMode(true)
        } else {
            toggleDarkMode(false)
        }
    }
});

window.generateThumbnail = async function(url){
    let image = new Image()
    image.crossOrigin = "Anonymous"
    image.src = url

    image.onload(await function(){
        
    })
}


window.setFavPosition = async function(mode){

    switch(mode){
        case 'off':
            localStorage.setItem('favoritesMode', 'off')
            document.getElementsByClassName("pinnedLinksWrapper")[0].style = "opacity: 0; pointer-events: none;"
            break

        case 'top':
            localStorage.setItem('favoritesMode', 'top')
            document.getElementsByClassName("pinnedLinksWrapper")[0].style = "opacity: 0; pointer-events: none; transform: translateY(-10%);"
            await wait(350)

            // append pinnedLinksWrapper to .topRight
            document.getElementById("topRight").appendChild(document.getElementsByClassName("pinnedLinksWrapper")[0])
            await wait(100)
            document.getElementsByClassName("pinnedLinksWrapper")[0].style = "opacity: 1; pointer-events: auto;"
            break

        case 'bottom':
            localStorage.setItem('favoritesMode', 'bottom')
            document.getElementsByClassName("pinnedLinksWrapper")[0].style = "opacity: 0; pointer-events: none; transform: translateY(10%);"
            await wait(350)

            // append pinnedLinksWrapper to .bottomRight
            document.getElementById("bottomRight").appendChild(document.getElementsByClassName("pinnedLinksWrapper")[0])
            await wait(100)
            document.getElementsByClassName("pinnedLinksWrapper")[0].style = "opacity: 1; pointer-events: auto;"

            break

        default:
            console.error("[!] Invalid mode")  
            break
            
    }
}
