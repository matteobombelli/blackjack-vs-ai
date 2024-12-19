import './App.css'

type ChipBalanceProps = {
    chipCount: number;
};

export default function ChipBalance({ chipCount }: ChipBalanceProps) {
    return(
        <>
            <div className="chips">
                <img src="../chips.png" alt="" />
                <p>{ chipCount }</p>
            </div>
        </>
    );
}