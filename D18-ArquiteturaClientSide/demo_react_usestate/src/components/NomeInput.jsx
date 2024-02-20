import { useState } from "react";

export function NomeImput() {
    const [texto, setTexto] = useState('teste');

    const handleChange = (event) => {
        setTexto(event.target.value);
    };

    return (
        <>
            <input value={texto} onChange={handleChange}/>
            <p>Seu nome é {texto}</p>
        </>
    );
}