SERVER_COMMAND="node /Users/marcpla/Documents/Feina/Projectes/mcp/mcp_rally/index.js"
BROWSER="safari" #"system", "chrome", "safari"

clear

get_browser() {
    case $BROWSER in
        "chrome")
            echo "Google Chrome"
            ;;
        "safari")
            echo "Safari"
            ;;
        "system")
            local browser_bundle_id=$(defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers | grep 'LSHandlerRoleAll.*http' -B 1 | grep LSHandlerURLScheme -A 1 | grep bundleid | cut -d'"' -f2)
            case $browser_bundle_id in
                "com.google.chrome")
                    echo "Google Chrome"
                    ;;
                "com.apple.safari")
                    echo "Safari"
                    ;;
                "org.mozilla.firefox")
                    echo "Firefox"
                    ;;
                *)
                    echo "Unknown"
                    ;;
            esac
            ;;
        *)
            echo "Unknown"
            ;;
    esac
}

close_previous_browser_tabs() {
    local browser=$(get_browser)
    case $browser in
        "Google Chrome")
            osascript <<EOF
            tell application "Google Chrome"
                set windowList to every window
                repeat with theWindow in windowList
                    set tabList to every tab of theWindow
                    repeat with theTab in tabList
                        if (URL of theTab contains "127.0.0.1") then
                            close theTab
                        end if
                    end repeat
                end repeat
            end tell
EOF
            ;;
        "Safari")
            osascript <<EOF
            tell application "Safari"
                activate
                repeat with w in windows
                    repeat with t in tabs of w
                        if (URL of t contains "127.0.0.1") then
                            tell w
                                set current tab to t
                                close current tab
                            end tell
                        end if
                    end repeat
                end repeat
            end tell
EOF
            ;;
        "Firefox")
            osascript <<EOF
            tell application "Firefox"
                set windowList to every window
                repeat with theWindow in windowList
                    set tabList to every tab of theWindow
                    repeat with theTab in tabList
                        if (URL of theTab contains "127.0.0.1") then
                            close theTab
                        end if
                    end repeat
                end repeat
            end tell
EOF
            ;;
    esac
}

open_new_browser_tab() {
    local url=$1
    local browser=$(get_browser)

    case $browser in
        "Google Chrome")
            open -a "Google Chrome" "$url"
            ;;
        "Safari")
            open -a "Safari" "$url"
            ;;
        *)
            # Per Firefox o desconegut, utilitzem el navegador per defecte
            open "$url"
            ;;
    esac
}

# Afegim una funció per gestionar els processos
cleanup() {
    echo "Netejant processos..."
    pkill -f "@modelcontextprotocol/inspector" 2>/dev/null || true
    pkill -f "node.*index.js" 2>/dev/null || true
    rm -f "$temp_file"
}

# Registrem la funció de neteja per quan es tanqui l'script
trap cleanup EXIT INT TERM

# Assegurem que no hi ha processos anteriors executant-se
cleanup

# Creem un fitxer temporal per la sortida
temp_file=$(mktemp)

# Executem l'inspector en segon pla i redirigim la sortida al fitxer temporal
npx @modelcontextprotocol/inspector $SERVER_COMMAND -e RALLY_INSTANCE=https://eu1.rallydev.com -e RALLY_APIKEY=_qlOLVsNXS1eUafkhIkMlZdE5IhwExUE3gfEAJlJwYTA -e RALLY_PROJECT_NAME="Backlog.Salesforce CSBD" > "$temp_file" 2>&1 &

# Guardem el PID del procés
server_pid=$!

# Esperem que el servidor estigui disponible
max_attempts=30
attempt=0
url=""

while [ $attempt -lt $max_attempts ]; do
    if grep -q "MCP Inspector is up and running at " "$temp_file"; then
        # Extraiem la URL i eliminem els emojis i altres caràcters especials
        url=$(grep "MCP Inspector is up and running at " "$temp_file" | sed 's/.*running at \(http[^ ]*\).*/\1/')
        break
    fi
    sleep 1
    ((attempt++))
    printf "."
done

if [ -n "$url" ]; then
    echo ""
    echo "Tancant pestanyes anteriors de l'Inspector..."
    close_previous_browser_tabs
    echo "Obrint la UI de MCP Inspector en una nova pestanya ($url)"
    open_new_browser_tab "$url"

    # Mostrem la sortida del servidor en temps real
    tail -f "$temp_file" &
    tail_pid=$!

    # Esperem que l'usuari premi Ctrl+C
    echo ""
    echo "Servidor MCP en execució. Prem Ctrl+C per aturar-lo."

    # Esperem el procés principal i netegem quan acabi
    wait $server_pid
    cleanup
else
    echo "Error: No s'ha pogut iniciar el servidor MCP després de $max_attempts intents"
    cleanup
    exit 1
fi

