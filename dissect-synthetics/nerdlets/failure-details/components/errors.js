[
    {
        "message":"Element A is not clickable at point (X, Y). Other element would receive the click: Element B",
        "type": "Scripting",
        "link": "https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/simple-scripted-or-scripted-api-non-ping-errors/#element-not-clickable",
        "docs": `<h3>Problem</h3><p>The synthetic script is attempting to <code>.click()</code> an element (Element A) at point (X,Y), but another element (Element B) is obscuring the target element.</p><h3>Solution</h3><p>Set a custom wait time, allowing time for a specific condition to be met. In this case, until the loading animation is no longer visible:</p><pre><code>.then(function() {\n    return $browser.wait($driver.until.elementIsNotVisible($browser.findElement($driver.By.id('LOADING'))), 10000);\n})</code></pre><p>Alternatively, you can set a custom <a href=\"/docs/synthetics/new-relic-synthetics/scripting-monitors/synthetics-scripted-browser-reference-monitor-versions-04x-or-lower#browser-sleep\">sleep delay</a> using <code>$browser.sleep(sleeptime_ms)</code>, stalling script execution for a specified amount of time. As this is a fixed amount of wait-time, which does not account for increased network latency or degraded site performance, we recommend using the <code>.wait()</code> function instead.</p><div class=\"callout-tip\"><p>This will not correct <code>.click()</code> issues caused by sticky headers or footers. In these instances, you may need to scroll manually to bring the target into view.</p></div><h3>Cause</h3><p>This happens if the target element, at the time of the <code>.click()</code> function, is obscured by:</p><ul>\n<li>A loading overlay, modal, or pop-up</li>\n<li>An animation that reveals the target element</li>\n<li>A sticky header or footer</li>\n</ul>`
    },
    {
        "message":"Error: element not visible",
        "type": "Scripting",
        "docs": ""
    },
    {
        "message":"Error: no such element: Unable to locate element: <LOCATOR>",
        "type": "Scripting",
        "docs": ""
    },
    {
        "message":"JobTimeoutError: Job timed-out after 180s",
        "type": "Scripting",
        "docs": ""
    },
    {
        "message":"NetworkError: Monitor produced no traffic",
        "type": ,
        "docs": ""
    },
    {
        "message":"",
        "type": ,
        "docs": ""
    },
    {
        "message":"",
        "type": ,
        "docs": ""
    },
    {
        "message":"",
        "type": ,
        "docs": ""
    },
    {
        "message":"",
        "type": ,
        "docs": ""
    },

]










































ReferenceError: $network is not defined





ScriptTimeoutError







StaleElementReferenceError: element is not attached to the page document








TaskTimedOut: task timed-out waiting for element to be located using: <LOCATOR>





TimeoutError: page load timed-out

TypeError: $browser.isElementPresent is not a function