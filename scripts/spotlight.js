import utils from './utils.js';
import { evaluate } from 'mathjs';
import emojiSearch from "@jukben/emoji-search" 
import twemoji from 'twemoji'
import { debounce } from "debounce";

document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Spotlight Search Module] Initializing...')
    let spotlight = document.getElementsByClassName('sl-wrapper')[0]
    let spotlightBg = document.getElementsByClassName('spotlightSearch')[0]


    spotlightBg.addEventListener('mousedown', function(e) {
        if(e.target.classList.contains('spotlightSearch')){
            toggleSpotlight(false)
        }
    })

    let keycombo = {
        ctrl: true,
        shift: false,
        alt: false,
        key: ' '
    } 
    
    let spotlightOpen = false;
    let finishedLoading = true;
    let g_link = ""

    // apply debounce from utils
    document.addEventListener('keydown', async function(e) {
        if (e.ctrlKey == keycombo.ctrl && e.shiftKey == keycombo.shift && e.altKey == keycombo.alt && e.key == keycombo.key) {
            e.preventDefault();
            console.log("[Spotlight Search Module] Spotlight Requested")
            window.closePopup()
            toggleSpotlight()
        }

        // if key is enter
        if (e.key == 'Enter') {
            e.preventDefault();
            // open the selected link
            if(g_link.replace(/^\s+|\s+$/g, '') == "") {
                return
            } else {
                await utils.wait(300)
                if(e.shiftKey || e.ctrlKey){
                    window.open(g_link, '_blank')
                } else {
                    document.location.href = g_link
                }
            }
        }

        if(e.key == 'Escape'){
            toggleSpotlight(false)
        }

    })

    // // when the user changes tab, close the spotlight
    // window.addEventListener('blur', function(e) {
    //     toggleSpotlight(false)
    // })

    document.getElementById('spotlightSearch').addEventListener('input', async function(e) {
        if(spotlightOpen){
            search(document.getElementById('spotlightSearch').value)
        }
    })

    window.toggleSpotlight = function(force) {


        // if force isn't set, toggle the spotlight
        if(force == undefined){
            force = spotlightOpen ? false : true
        }

        console.log("[Spotlight Search Module] Setting spotlight to " + force)
        
        if (force == true) {
            // focus on #spotlightSearch
            spotlightOpen = true
            document.getElementById('spotlightSearch').value = ''
            document.getElementsByClassName('results')[0].value = ''
            document.getElementsByClassName('results')[0].style.display = 'none'
            document.getElementById('spotlightSearch').focus()

            spotlightBg.style = 'opacity: 1; pointer-events: auto;'
            spotlight.style = 'opacity: 1; pointer-events: auto; transform: scale(100%);'
        } else if (force == false) {
            spotlightOpen = false
            spotlightBg.style = 'opacity: 0; pointer-events: none;'
            spotlight.style = 'opacity: 0; pointer-events: none; transform: scale(97%);'
        } else {
            console.warn("[Spotlight Search Module] Unknown force value: " + force)
        }
    }


    window.search = async function(query) {
        if (query.replace(/\s/g, '').length < 1 || query.replace(/\s/g, '').length > 100) {
            document.getElementsByClassName('results')[0].style.display = 'none'
            return;
        }

        
        // fetch results from duckduckgo's instant answer API
        let ddgData = "";
        let richData = "";
        finishedLoading = false


        try{
            if(evaluate(query) != undefined && query.length > 2 && !isNaN(evaluate(query) && evaluate(query) == query)){
                // if evaluate(query) returns the function, it shouldn't be shown
                if(isNaN(evaluate(query))){
                    console.log("[Spotlight Search Module] Query is a math expression, but it's not a number")
                    return
                }
                
                
                richData = {
                    type: 'math',
                    title: evaluate(query) == NaN ? '' : evaluate(query),
                    description: query,
                    // material icon for definition
                    icon: 'functions', 
                }
            } 
        } catch(e){
            // if message starts with :, the user is looking for an emoji (:grin: -> 😁)
            if(query.startsWith(':') && query.length > 1){
                let emoji = emojiSearch(query.replace(/^\s+|\s+$/g, '').replace(/^:/, '').replace(/:$/, '').replace(/ /g, '_'))
                if(emoji.length > 0){
                    richData = {
                        type: 'emoji',
                        title: emoji[0].name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        description: 'Press enter to copy to clipboard',
                        // the icon should be the emoji, turn the char into unicode
                        icon: twemoji.parse(emoji[0].char),
                        suggestions: emoji.slice(1)
                    }
                }
            } else {
                console.log("[Spotlight Search Module] DuckDuckGo")

                await fetch('https://api.duckduckgo.com/?q=' + query + '&format=json&no_html=1&no_redirect=1&t=castview', 
                {
                    method: 'GET',
                })
                    .then(response => response.json()) 

                    .then(data => {
                        console.log("[Spotlight Search Module] Data received from DuckDuckGo")
                            if (data.Redirect){
                                // if redirect is set, then it's a bang search

                                let searchQuery = query.split(' ').slice(1).join(' ')
                                let cleanLink = data.Redirect.replace(/https?:\/\/(www\.)?/g, '').split('/')[0] 

                                console.log("[Spotlight Search Module] Requested URL: " + data.Redirect)
                                g_link = data.Redirect


                                richData = {
                                    type: 'bang',
                                    title: searchQuery ? searchQuery : cleanLink,
                                    description: "Search on " + cleanLink,
                                    icon: `https://www.google.com/s2/favicons?sz=64&domain_url=${cleanLink}`,
                                    url: data.Redirect,
                                }


                            } else if (data.definition) {
                                globalLink = data.definitionURL

                                richData = {
                                    type: 'definition',
                                    title: utils.trim(data.definition, 100),
                                    description: "From " + data.definitionSource,
                                    // material icon for definition
                                    icon:'magic_button'
                                }

                            } else if (data.Answer) {
                                    if(data.answerType == "ip"){
                                        richData = {
                                            type: 'data-ip',
                                            desc: 'Your current IP address',
                                            title: data.Answer,
                                        }
                                    } else {
                                        richData = {
                                            type: 'answer',
                                            title: utils.trim(data.Answer, 100),
                                            description: "Placeholder text",
                                        }   
                                    }
                            } else if (data.AbstractText) {
                                richData = {
                                    type: 'abstract',
                                    title: utils.trim(data.AbstractTitle, 100),
                                    description: utils.trim(data.AbstractText, 100),
                                    icon: 'info',
                                    url: data.AbstractURL,
                                }
                            } else {
                                richData = {
                                    type: 'base',
                                }
                            }
                        
                    let ddgSuggestions = "";
                    // fetch('https://api.duckduckgo.com/ac/?q=' + query + '&kl=wt-wt')
                    //     .then(response => response.json())
                    //     .then(data => {
                    //         // place the results inside richData
                    //         richData.suggestions = data.map(suggestion => {
                    //             return suggestion.phrase
                    //         })
                    //     })
                    })
                }
            }
            // set the items inside the .results div
            if(richData){
                console.log(richData)
                document.getElementsByClassName('results')[0].style.display = 'block'
                // if richData.icon starts with "https://" then it's a url otherwhise it's a material icon
                let isUrl = richData.icon.startsWith("https://")
                document.getElementsByClassName('results')[0].innerHTML = `<div class="result" id="rich-main">
                                                                            <div class="result-icon">
                                                                                ${isUrl ? `<img src="${richData.icon}" alt="${richData.title}" loading="lazy">` : `<i class="material-icons">${richData.icon}</i>`}
                                                                            </div>
                                                                            <div class="result-text">
                                                                                <div class="answer">${richData.title}</div>
                                                                                <div class="subtitle">${richData.description}</div>
                                                                            </div>
                                                                        </div>`
                                                                        

                if(richData.suggestions){
                    // limit to 5 suggestions if there are more than 5
                    let suggestions = richData.suggestions.slice(0, 5)
                    for(let i = 0; i < suggestions.length; i++){
                        if(richData.type == 'emoji'){
                            document.getElementsByClassName('results')[0].innerHTML += `<div class="result">${twemoji.parse(suggestions[i].char)}&nbsp;&nbsp;${suggestions[i].name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>`
                        } else {    
                            //list suggestion directly
                            document.getElementsByClassName('results')[0].innerHTML += `<div class="result">${suggestions[i]}</div>`
                        }
                    }      
                }
            } else {
                document.getElementsByClassName('results')[0].style.display = 'none'
            }
        }
    })


