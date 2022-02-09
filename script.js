import 'regenerator-runtime/runtime'
import { async } from 'regenerator-runtime/runtime'
const earthview = require("./assets/earthview.json") 
const changelog = require("./assets/changelog.json")

// fetch the new changelog from github

window.fetchChangelog = async function(){
    // fetch the changelog json from github
    let changelogUrl = await fetch("https://raw.githubusercontent.com/LukeGotBored/CastView/master/assets/changelog.json")
    let changelogData = await changelogUrl.json()
    return changelogData

}




let availableLanguages = ["it", "fr", "en", "es"]
let globalLanguage = navigator.language.split("-")[0]
let languageOverride = [false, "en"]

if(!availableLanguages.includes(globalLanguage)){
    console.error("[!] Language not available, defaulting to english")
    globalLanguage = "en"
}

if(languageOverride[0]){
    globalLanguage = languageOverride[1]
}



document.addEventListener('DOMContentLoaded', async() => {
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
    
    console.log("[*] Current language: " + globalLanguage)

    // load the changelog 
    document.getElementById("betaBadge").innerHTML = changelog.version + " • " + changelog.date
    document.getElementById("cl-descContent").innerHTML = changelog.description.replace(/\n/g, "<br>")
    
    if(changelog.changes.length > 0){
        // make a list
        let changesList = document.getElementById("cl-updates")
        // place the list inside changesList
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
    
    
    
    // Initialize the date
    document.getElementById("date").innerHTML = "" + generateDate(new Date())
    document.getElementById("clockString").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    
    
    document.getElementById("popupManager").addEventListener('click', async function(e){
        if(e.target.id == "popupManager"){
            // get the popup that is currently not display: none;
            closePopup()
        }
        
    })
    
    
    
    
    // wait for the image to load
    try{
        await updateWeather("London");
        await setWallpaper();
        openPopup("about")
    } catch(e) {
        document.getElementsByClassName('background')[0].style.opacity = 0
        

    }




    // clock
    let tick = setInterval(async function() {
        document.getElementById("date").innerHTML = "" + generateDate(new Date())
        document.getElementById("clockString").innerHTML = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }, 1000)

    let weatherUpdateCycle = setInterval(async function(){
        // if the weather is on the page
        if(document.getElementsByClassName("weather").length > 0){
            updateWeather("Rome");
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
            reject(new Error('Could not load image at ' + url))
        }
        img.src = url
    })
}

window.updateWeather = async function(place){
    // get the current language
    let language = globalLanguage
    


    let weatherUrl;
    let weatherData
    if(!place){
        weatherUrl = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=128b2a70fd3d8d83854ae6d95ec1a1eb&units=metric&lang=${language}`)
        weatherData = await weatherUrl.json()

    } else {
        weatherUrl = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(place)}&appid=128b2a70fd3d8d83854ae6d95ec1a1eb&units=metric&lang=${language}`)
        weatherData = await weatherUrl.json()

        if(weatherData.cod == "404"){
            console.error("[!] City not found")
            return
        }
    }

    
    // format the weather data
    document.getElementById("weatherTemp").innerHTML = weatherData.main.temp + "°C"
    document.getElementById("weatherLocation").innerHTML = "&nbsp;" + weatherData.name
    // generate the icon url
    let iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`
    document.getElementById("weatherIcon").src = iconUrl
    document.getElementById("weatherIcon").alt = weatherData.weather[0].description
    document.getElementById("weatherIcon").title = weatherData.weather[0].description

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

    switch(globalLanguage){
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
            // show the popup-background (opacity 1, display: grid)
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1

            // set opacity 1 and display block of the popup with id "about"
            document.getElementById("about").style.display = "block"
            document.getElementById("about").style.transform = "scale(1)"
            document.getElementById("about").style.opacity = 1

        break;

        case "settings":
            document.getElementsByClassName("popup-background")[0].style.display = "grid"
            await wait(100)
            document.getElementsByClassName("popup-background")[0].style.opacity = 1

            // set opacity 1 and display block of the popup with id "about"
            document.getElementById("settings").style.display = "block"
            document.getElementById("settings").style.transform = "scale(1)"
            document.getElementById("settings").style.opacity = 1
            
        break

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

window.setWallpaper = async function(provider){
    try{
    let availableProviders = ['earth', 'unsplash', 'custom']
    
    if(!provider || !availableProviders.includes(provider)){
        provider = 'earth'
        console.warn("[?] Couldn't find the requested provider, setting back to 'earth'")
    }
    
    switch(provider){
            case 'earth':
                
                // get a random number between 0 and the length of the array
                const randomNumber = Math.floor(Math.random() * earthview.length)
                // get the random wallpaper
                const wallpaper = earthview[randomNumber].image



                const image = await loadImage(wallpaper)
                document.getElementsByClassName('background')[0].style.opacity = 0;
                
                document.body.style.background = `linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0,0,0,0.7)), url(${wallpaper})`

                let creditString = earthview[randomNumber].region ? `${earthview[randomNumber].country}, ${earthview[randomNumber].region}` : `${earthview[randomNumber].country}`
                document.getElementsByClassName("credits")[0].innerHTML = `<a href="${earthview[randomNumber].map}" target="_blank">${creditString}</a>`
                break;
            }            
        }catch(e) {
            setWallpaper(provider);
            console.warn("an invalid wallpaper was found, skipping...")
        }   
}

