const variableErrors = [
    {
        "message": "Error: no such element: Unable to locate element: <LOCATOR>",
        "rLike": /Error: no such element: Unable to locate element:(.*)/i
    },
    {
        "message": "TaskTimedOut: task timed-out waiting for element to be located using: <LOCATOR>",
        "rLike": /TaskTimedOut: task timed-out waiting for element to be located using:(.*)/s
    },
    {
        "message": "NetworkError: Connect to (HOST) [HOST./IP ADDRESS] failed: connect timed out",
        "rLike": /NetworkError: Connect to (.*) failed: connect timed out/s
    },
    {
        "message": "NetworkError: Connect to (HOST) [HOST./IP ADDRESS] failed: Connection refused",
        "rLike": /NetworkError: Connect to (.*) failed: Connection refused/s
    },
    {
        "message": "HTTPError: Server replied with HTTP XXX response code",
        "rLike": /HTTPError: Server replied with HTTP (.*) response code/s
    },
    {
        "message": "SSLVerificationError: (ERROR)",
        "rLike": /SSLVerificationError:(.*)/s
    },
    {
        "message": "NetworkError: DNS resolution failed for host: (HOST)",
        "rLike": /NetworkError: DNS resolution failed for host: (.*)/s
    },
    {
        "message": "BlockedRequestError: (URL)",
        "rLike": /BlockedRequestError:(.*)/s
    }
]

export default variableErrors;