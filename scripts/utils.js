import 'regenerator-runtime/runtime'
import FastAverageColor from 'fast-average-color'

const FAC = new FastAverageColor()


module.exports = {
    updateTitle:function(text){
        if(!text){
            
            let time = new Date().getHours() % 12;
     

            let clock = [
                ["🕛", "🕧"],
                ["🕐", "🕜"],
                ["🕑", "🕝"],
                ["🕒", "🕞"],
                ["🕓", "🕟"],
                ["🕔", "🕠"],
                ["🕕", "🕡"],
                ["🕖", "🕢"],
                ["🕗", "🕣"],
                ["🕘", "🕤"],
                ["🕙", "🕥"],
                ["🕚", "🕦"],
            ]



            // if the minutes are less than 30, the first emoji will be displayed
            if (new Date().getMinutes() < 30) {
                // get the first emoji from the clock array
                text = clock[time][0];
            } else {
                // get the second emoji from the clock array
                text = clock[time][1];
            }
    

            // let emojis = [
            //     [0, "🌃"],
            //     [6, "🌅"],
            //     [10, "🏙️"],
            //     [16, "🌇"],
            //     [18,"🌆"],
            //     [23,"🌃"],
            // ]

            // LEGACY SYSTEM || DEPRECATED
            // for(let i = 0; i < emojis.length; i++){
            //     if(time >= emojis[i][0]  ){
            //         text = emojis[i][1] 
            //     } else {
            //         continue
            //     }
            // }

            // if(!text){
            //     text = "👋"
            // }
        }
    
        const canvas = document.createElement('canvas');
        canvas.height = 32;
        canvas.width = 32;
    
        const ctx = canvas.getContext('2d');
        ctx.font = '28px serif';
        ctx.fillText(text, -2, 24);


        const favicon = document.querySelector('link[rel=icon]');
        if (favicon) { favicon.href = canvas.toDataURL(); }
    },

    fetchChangelog:async function(){
        try{
            let changelogUrl = await fetch("https://raw.githubusercontent.com/LukeGotBored/CastView/master/assets/changelog.json")
            let changelogData = await changelogUrl.json()
            // console.log(changelogData)
            return changelogData
        } catch(e){
            console.log("[!] Couldn't fetch changelog")
            return false;
        }
    },

    loadImage:async function(url) {
        var img = new Image();
        // load image using await
        return new Promise(function(resolve, reject) {
            img.onload = function() {
                resolve(img);
            };
            img.src = url;
        });
    },

    getAverageColor:async function(img){
        // load image using await
        let image = new Image();
        image.crossOrigin = "Anonymous";
        image.src = img;
        return new Promise(function(resolve, reject) {
            image.onload = function() {
                resolve(FAC.getColor(image));
            };
        });
    },

    loadJSON:async function(url){
        try{
            let response = await fetch(url)
            let data = await response.json()
            return data
        } catch(e){
            console.log("[!] Couldn't fetch json")
            return false;
        }
    },

    toBase64:async function(string){
        // vanilla base64 encode
        return btoa(string)
    },

    wait:function(ms){
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    trim:function(string, maxLength){
        if(string.length > maxLength){
            return string.substring(0, maxLength - 3) + "..."
        } else {
            return string
        }
    }
}