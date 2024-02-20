export function MeuBotao() {
    function handleClick() {
        alert('Clicou o botão!');
    }
    
    return (
        <button id="botaoClicavel" onClick={handleClick}>Clique Aqui</button>
    );
}