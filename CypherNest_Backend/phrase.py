import secrets

def genphrase():
    words=[
        "apple","river","moon","forest","cloud","stone","tiger","ocean",
        "eagle","flame","mountain","shadow","silver","rocket","winter",
        "sunset","thunder","garden","falcon","crystal","dragon","violet",
        "desert","planet","coffee","orange","castle","wolf","rain","island"
    ]
    phrase=[]
    for i in range(6):
        phrase.append(secrets.choice(words))
    return "-".join(phrase)

print(genphrase())