export default {
    PROXMOX_SERVER: {
    },
    SPARK_SERVER: {
        
    },
    PROXMOX_API_SERVER: {
        cookie: ["PVEAuthCookie"],
        headers:["CSRFPreventionToken"],
        "/api/admin": {
            "/requests/deploy": {
                type: "GET",
                returnsBody: "x/y requests deployed successfully"
            },
            "/requests/delete": {
                type: "DELETE", 
                params: {
                    ids: {
                        what: "Comma-separeted ids to delete",
                        optional: true,
                        ifNoParam: "do nothing"
                    },
                    marked: {
                        what: "Delete all ids marked for removal",
                        optional: true,
                        ifNoParam: "do nothing",
                    }
                },
                returnsBody: "info: Delete operation completed successfully."
            },
            "/requests/resize": {
                type: "GET", 
                returnsBody: "Vms were resized successfully"
            },
            "/cluster": {
                type: "GET",
                returnsBody: {
                    /// get result of api2/json/cluster/resource
                }
            }
        },
        "/api/auth": {
            "/signin": {
                type: "POST",
                needsBody: ["username", "password"],
                returnsBody: "proxmox ticket",
            },
            "/signup": {
                type: "POST",
                needsBody: ["username", "password", "email"],
                returnsBody: ["User registered successfuly"]
            },
            "/resetPassword": {
                type: "POST",
                needsBody: ["email"],
                returnsBody: "Mail was sent successfully"
            },
            "/changePassword": {
                type: "POST",
                needsBody: ["token", "password"],
                returnsBody: "password was changed successfully"
            },
            "/signout": {
                type: "DELETE",
            }
        },
        "/api/node": {
            "/info": {
                type: "GET",
                param: ["nodeId"], //all if no node id,
                returnsValue: {
                    //if there's no id api call of /api2/json/nodes/,
                    //else api call of /api2/json/nodes/{nodeid}/status/
                }
            }
        },
    },
}