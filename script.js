import 'regenerator-runtime/runtime'
import { async } from 'regenerator-runtime/runtime'

const earthview = require("./assets/earthview.json") 
const changelog = require("./assets/changelog.json")


window.fetchChangelog = async function(){
    let changelogUrl = await fetch("https://raw.githubusercontent.com/LukeGotBored/CastView/master/assets/changelog.json")
    let changelogData = await changelogUrl.json()
    return changelogData
}



let availableLanguages = ["it", "fr", "en", "es", "default"];
let availableWallpaperProviders = ["unsplash", "earth"];
let globalLanguage = navigator.language.split("-")[0]
let defaultWallpaper



window.settings = {
    "firstTime": localStorage.getItem("firstTime") ? false : true,
    "language": localStorage.getItem("language") ? localStorage.getItem("language") : (availableLanguages.includes(globalLanguage) ? globalLanguage : "en"),
    "weather": localStorage.getItem("weather") ? localStorage.getItem("weather") : true,
    "location": localStorage.getItem("location") ? localStorage.getItem("location") : "auto",
    "24hour": localStorage.getItem("24hour") ? localStorage.getItem("24hour") : false,
    "theme": localStorage.getItem("theme") ? localStorage.getItem("theme") : "light",
    "hasSeenChangelog": localStorage.getItem("hasSeenChangelog") ? localStorage.getItem("hasSeenChangelog") : false,
    "widescreen": localStorage.getItem("widescreen") ? localStorage.getItem("widescreen") : false,
    "provider": localStorage.getItem("provider") ? localStorage.getItem("provider") : "earth",
}




// SETTINGS WILL GO HERE 


// Language
if(!settings.language || availableLanguages.indexOf(settings.language) == -1){
    if(!availableLanguages.includes(globalLanguage)){
        console.error(`[!] Language "${globalLanguage}" not available, defaulting to english`)
        console.log("[*] Want to help translating CastView? Contact me on Telegram!\nhttps://t.me/lukethewuke")
        localStorage.setItem("language", "en")
    } else {
        localStorage.setItem("language", globalLanguage)
    }
}

if(!availableLanguages.includes(settings.language)){
    console.error(`[!] Language "${settings.language}" not available, defaulting to english`)
}

// Wallpaper
if(!localStorage.getItem("wallpaper") || availableWallpaperProviders.indexOf(localStorage.getItem("wallpaper")) == -1){
    localStorage.setItem("wallpaper", "earth")
}

if(!availableWallpaperProviders.includes(settings.provider)){
    console.error(`[!] Wallpaper provider "${settings.provider}" not available, defaulting to earth`)
    localStorage.setItem("wallpaper", "earth")
}


// location
let geoLoc;
if(!settings.location || settings.location == "auto"){
    localStorage.setItem("location", "auto")
}




document.addEventListener('DOMContentLoaded', async() => {
    console.log("[*] Current language: " + settings.language)
    
    // Initialize the date
    document.getElementById("date").innerHTML = "" + generateDate(new Date())
    document.getElementById("clockString").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    
    document.getElementById("popupManager").addEventListener('click', async function(e){
        if(e.target.id == "popupManager"){
            closePopup()
        } 
    })


    // wait for stuff to load
    try{
        await updateWeather(geoLoc);
        await setWallpaper();
        
        // openPopup("egg")      
    } catch(e) {
        console.error(`Something went wrong!\n${e}`)
    }

    // clock
    let clockTick = setInterval(async function() {
        document.getElementById("date").innerHTML = "" + generateDate(new Date())
        document.getElementById("clockString").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }, 1000)

    let weatherUpdateCycle = setInterval(async function(){
        if(!document.getElementsByClassName("weatherWrapper").display == "none" ||!document.getElementsByClassName("weatherWrapper").display == ""){
            updateWeather(geoLoc);
        } else {
            clearInterval(updateWeather);
        } 
    }, 60000)
})


window.loadImage = function(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image()
        img.onload = function() {
            resolve(img)
        }
        img.onerror = function() {
            reject(new Error(`[!] Couldn\'t load image from given url (${url})`))
        }

        img.src = url
    })
}

window.updateWeather = async function(place){
    let currentName = document.getElementById("weatherLocation").innerHTML == "&nbsp;" + place ? true : false
    console.log(document.getElementById("weatherLocation").innerHTML)
    console.log(place)
    console.log("[*] Requested city is the same? " + currentName)
    let language = settings.language
    
    if(!place){
        if(settings.location == "auto"){
            return fetchLocation()
        } else {
            place = settings.location
        }
    }

    console.log(`[*] Current location: ${geoLoc ? geoLoc : "Unknown"}`)

    if(!currentName){
        document.getElementsByClassName("weatherWrapper")[0].style.opacity = "0"
    } else {
        document.getElementById("weatherInfo").style.opacity = "0"
    }
    
    let weatherUrl;
    let weatherData;

    
    weatherUrl = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(place)}&appid=128b2a70fd3d8d83854ae6d95ec1a1eb&units=metric&lang=${language}`)
    weatherData = await weatherUrl.json()
    if(weatherData.cod == "404"){
        console.error("[!] City not found")
        settings.location = "auto"
        document.getElementsByClassName("weatherWrapper")[0].style.opacity = 1
        document.getElementById("weatherInfo").style.opacity = 1
        return false
    }


    
    // format the weather data
    document.getElementById("weatherTemp").innerHTML = weatherData.main.temp + "°C"
    document.getElementById("weatherLocation").innerHTML = "&nbsp;" + weatherData.name
    // generate the icon url
    let iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`
    document.getElementById("weatherIcon").src = iconUrl
    document.getElementById("weatherIcon").alt = weatherData.weather[0].description
    document.getElementById("weatherIcon").title = weatherData.weather[0].description

    document.getElementsByClassName("weatherWrapper")[0].style.display = "block"
    await wait(100)
    if(!currentName){
        document.getElementsByClassName("weatherWrapper")[0].style.opacity = 1
    } else {
        document.getElementById("weatherInfo").style.opacity = 1
    }

}

window.fetchLocation = async function(){
    if(navigator.geolocation){
        await navigator.geolocation.getCurrentPosition(async(position) => {
            let lat = position.coords.latitude
            let lon = position.coords.longitude
            geoLoc = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=128b2a70fd3d8d83854ae6d95ec1a1eb`)
            geoLoc = await geoLoc.json()
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
    // return a date such as "January 1st, 2020"
    //[
    //  [italian,french,english,spanish],
    //  [italian,french,english,spanish]
    //]


    let monthNames = [
        ["Gennaio", "Janvier", "January", "Enero"],
        ["Febbraio", "Février", "February", "Febrero"],
        ["Marzo", "Mars", "March", "Marzo"],
        ["Aprile", "Avril", "April", "Abril"],
        ["Maggio", "Mai", "May", "Mayo"],
        ["Giugno", "Juin", "June", "Junio"],
        ["Luglio", "Juillet", "July", "Julio"],
        ["Agosto", "Août", "August", "Agosto"],
        ["Settembre", "Septembre", "September", "Septiembre"],
        ["Ottobre", "Octobre", "October", "Octubre"],
        ["Novembre", "Novembre", "November", "Noviembre"],
        ["Dicembre", "Décembre", "December", "Diciembre"]
    ]


    let daysSuffix = ["st", "nd", "rd", "th"]

    let day = date.getDate()

    let daySuffix = daysSuffix[day % 10 - 1]
    if (daySuffix == undefined) {
        daySuffix = "th"
    }

    switch(localStorage.getItem("language")){
        case "it":
            return `${day} ${monthNames[date.getMonth()][0]} ${date.getFullYear()}`
        case "fr":
            return `${day} ${monthNames[date.getMonth()][1]} ${date.getFullYear()}`
        case "en":
            return `${monthNames[date.getMonth()][2]} ${day}${daySuffix}, ${date.getFullYear()}`
        case "es":
            return `${day} ${monthNames[date.getMonth()][3]} ${date.getFullYear()}`
        default:
            return `${monthNames[date.getMonth()][2]} ${day}${daySuffix}, ${date.getFullYear()}`
    }

}

window.closePopup = async function(item){
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
}

window.openPopup = async function(popupType){
    for(let i = 0; i < document.getElementsByClassName("popup").length; i++){
        if(document.getElementsByClassName("popup")[i].style.display != "none" || !document.getElementsByClassName("popup")[i].style.display){
            document.getElementsByClassName("popup")[i].style.opacity = 0
            document.getElementsByClassName("popup")[i].style.transform = "scale(0.9)"
            await wait(500)
            document.getElementsByClassName("popup")[i].style.display = "none"
        }
            document.getElementsByClassName("popup")[i].style.display = "none"
    }

    // create the new popup
    switch(popupType){
        case "about":
            await checkForUpdates()
            // load the changelog 
            document.getElementById("betaBadge").innerHTML = changelog.version + " • " + changelog.date
            document.getElementById("cl-descContent").innerHTML = changelog.description.replace(/\n/g, "<br>")

            if(changelog.changes.length > 0){
                let changesList = document.getElementById("cl-updates")
                changesList.innerHTML = ""
                for(let i = 0; i < changelog.changes.length; i++){
                    let change = `<b>${changelog.changes[i].title}</b><br>${changelog.changes[i].description}`
                    if(i != changelog.changes.length - 1){
                        change+= "<br><br>";
                    }

                    let changeItem = document.createElement("li")
                    changeItem.innerHTML = change
                    changesList.appendChild(changeItem)
                }
            } else {
                document.getElementById("cl-updates").style.display = "none"
            }
            
            if(!changelog.notice){
                document.getElementById("cl-notice").style.display = "none"
            } else {
                document.getElementById("cl-notice").innerHTML = changelog.notice
            }

            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1


            document.getElementById("about").style.display = "block"
            document.getElementById("about").style.transform = "scale(1)"
            document.getElementById("about").style.opacity = 1
        break;

        case "settings":
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1

            document.getElementById("settings").style.display = "block"
            document.getElementById("settings").style.transform = "scale(1)"
            document.getElementById("settings").style.opacity = 1
        break

        case "egg":
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1

            document.getElementById("egg").style.display = "block"
            document.getElementById("egg").style.transform = "scale(1)"
            document.getElementById("egg").style.opacity = 1
            startMinigame()
        break;

        default:
            console.warn("Couldn't find the requested popup!")
            closePopup()
            break
    }

    // show the popup
    let popup = document.getElementsByClassName("popup")[0]
    popup.style.opacity = 1
    popup.style.transform = "scale(1)"
        
}

window.wait = async function(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}




window.checkForUpdates = async function(){
    /* TO BE ADDED 
        - Notifications
        - Errors
        - Automatic updates
    */

    let newChangelog = await fetchChangelog()
    if(newChangelog.version != changelog.version){
        if(changelog.versionId < newChangelog.versionId){
            // it's out of date
            console.log("[*] There's a new update available" + `(${changelog.version} | ${changelog.versionId} -> ${newChangelog.version} | ${newChangelog.versionId})`)
            document.getElementById("err-description").innerHTML = `There's a new build of CastView available for download!`
        } else {
            // if it's newer than release
            console.error("[*] You are using a developer build, you shouldn't be using this!"+ `(${changelog.version} | ${changelog.versionId} -> ${newChangelog.version} | ${newChangelog.versionId})`) 
            document.getElementById("err-description").innerHTML = `You are using a developer build, something probably went (very) wrong!`
        }
        
    } else {
        console.log("[*] Everything is up to date!")
        document.getElementById("cl-error").style.display = "none"
    }
}



// SETTINGS
window.setLanguage = async function(language){
    if(!availableLanguages.includes(language)){
        console.warn("[!] The requested language is not available")
        return
    } else {
        if(language == "default"){
            language = globalLanguage;
        }
        
        localStorage.setItem("language", language)
        document.getElementById("date").style.opacity = 0;
        document.getElementById("date").innerHTML = "" + generateDate(new Date())
        document.getElementById("clockString").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        document.getElementsByClassName("weather-location")[0].style.opacity = 0;
        await updateWeather();
        document.getElementsByClassName("weather-location")[0].style.opacity = 1;
        document.getElementById("date").style.opacity = 1;
    }
};


window.setWallpaper = async function(provider){
    let tries = 0
    try{
        tries++
        let availableProviders = ['earth', 'unsplash', 'custom']
        
        if(!provider || !availableProviders.includes(provider)){
            provider = 'earth'
            console.warn("[?] Couldn't find the requested provider, setting back to 'earth'")
        }

        let wallpaper;
        let image;

        document.getElementsByClassName('background')[0].style.opacity = 1;
        document.getElementsByClassName("credits")[0].style.opacity = 0;
        switch(provider){
            case 'earth':
                let randomNumber = Math.floor(Math.random() * earthview.length)
                wallpaper = earthview[randomNumber].image

                image = await loadImage(wallpaper)
                document.getElementsByClassName('background')[0].style.opacity = 0;
                
                document.body.style.background = `linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0,0,0,0.7)), url(${wallpaper})`

                let creditString = earthview[randomNumber].region ? `${earthview[randomNumber].country}, ${earthview[randomNumber].region}` : `${earthview[randomNumber].country}`
                document.getElementsByClassName("credits")[0].innerHTML = `<a href="${earthview[randomNumber].map}" target="_blank" title="Photo from Google Earth">${creditString}</a>`
                break;

            case 'unsplash':
                wallpaper = 'https://source.unsplash.com/random/1920x1080?landscape,wallpaper&random=' + Math.random()
                image = await loadImage(wallpaper)
                document.body.style.background = `linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0,0,0,0.7)), url(${wallpaper})`
                document.getElementsByClassName("credits")[0].innerHTML = `<a href="https://unsplash.com/" target="_blank">Photo from <span style="text-decoration: underline;">Unsplash</span></a>`
                break;
            }    

        }catch(e) {
            if(tries < 10){
                setWallpaper(provider);
                console.warn("an invalid wallpaper was found, skipping...")
            } else {
                console.error("[!] Couldn't load any wallpaper, check your internet connection")
                console.log(e)
            }
        }   
        document.getElementsByClassName('background')[0].style.opacity = 0;
        document.getElementsByClassName("credits")[0].style.opacity = 1;
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


    window.switchSettingsTab = async function(element){
        let tab = element.getAttribute("data-tab")
        let availableTabs = [
            "general",
            "customization",
            "language",
            "about"
        ]

        if(!availableTabs.includes(tab)){
            console.warn("[!] The requested tab is not available")
            return
        }

        document.getElementById("settings-content").style.opacity = 0;
        document.getElementById("settings-content").style.transform = "scale(0.95)"
        
        // "element" is the button
        // the page contains all the settings tabs, but they're all hidden

        // we need to show the right tab
        document.getElementById("tab-" + tab).style.display = "block"


        document.getElementById("settings-content").style.opacity = 1;
        document.getElementById("settings-content").style.transform = "scale(1)"

        console.log("[*] Switching to tab: " + tab)


    }