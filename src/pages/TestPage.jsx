import React, { useState } from "react";
import { useParams } from "react-router-dom";

import ProdutoFaccoes from "../components/produtos/ProdutoFaccoes";

const TestPage = () => {
    const [open, setOpen] = useState(false);

    const { produtoId } = useParams();

    return (
        <div style={{ padding: 40 }}>
            <button
                onClick={() => setOpen(true)}
                style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                }}
            >
                Abrir modal
            </button>

            <ProdutoFaccoes
                isOpen={open}
                onClose={() => setOpen(false)}
                produtoId={Number(produtoId)}
            />
        </div>
    );
};

export default TestPage;
