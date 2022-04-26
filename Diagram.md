
```mermaid
graph LR
    OSXML[OperatingSystem.xml] --> OST{Transforms} --> OSPP[GPOS PP]
    TLS_XML[tls.xml] --> TLS_T{Transforms} --> TLS_PP[TLS PP]

    TLS_XML --> STWIZ
    OSXML   --> STWIZ((ST Wizard))
    APP_XML --> STWIZ
    SSH_XML --> STWIZ
    TD1     --> STWIZ
    TD2         --> STWIZ
    OS_PREV_XML --> STWIZ

    STWIZ --> STAuthorX( Product X ST Author )
    STAuthorX --> STX[Product X ST Document]
    STAuthorX --> EAsX[Product X List of EAs]
    STWIZ --> STAuthorY( Product Y ST Author )
    STAuthorY --> STY[Product Y ST Document]
    STAuthorY --> EAsY[Product Y List of EAs]
    STWIZ --> STAuthorZ( Product Z ST Author )
    STAuthorZ --> STZ[Product Z ST Document]
    STAuthorZ --> EAsZ[Product Z List of EAs]

    SSH_XML[ssh.xml] --> SSH_T{Transforms} --> SSH_PP[SSH PP]
    APP_XML[Application.xml] --> APP_T{Transforms} --> APP_PP[APP PP]
    TD1[TD0001] --> TD1_T{Transforms} --> TD1_M(TD1 Message)
    TD2[TD0002] --> TD2_T{Transforms} --> TD2_M(TD2 Message)
    OS_PREV_XML[OperatingSystem-4.0.xml] --> OS4_T{Transforms} --> OS_4_PP[GPOS 4.0 PP]
```
