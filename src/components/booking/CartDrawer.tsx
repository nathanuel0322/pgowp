import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { IconButton } from "@mui/material";
import "../../assets/css/cartdrawer.css";
import { useContext } from "react";
import { AppContext } from "../../App";

export default function CartDrawer({
    cartDrawerOpen,
    setCartDrawerOpen,
}: {
    cartDrawerOpen: boolean;
    setCartDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const { cart } = useContext(AppContext);

    return (
        <SwipeableDrawer
            anchor={"right"}
            open={cartDrawerOpen}
            onOpen={() => {}}
            onClose={() => setCartDrawerOpen(false)}
            id="cartdrawer"
        >
            <div>
                <IconButton onClick={() => setCartDrawerOpen(false)} sx={{ justifyContent: "flex-start" }}>
                    <CloseIcon fontSize="small" sx={{ width: 1 / 4, height: 1 / 4, color: "white" }} />
                </IconButton>
            </div>
            {cart.length > 0 ? (
                <div className="text-xl flex flex-col gap-[2vh]">
                    {cart.map((item, index) => (
                        <div key={index} className="text-[#141229] bg-white p-2 rounded-lg">
                            <div>
                                <h4>{item.title}</h4>
                                {item.price && <p>Price: ${item.price.toFixed(2)}</p>}
                            </div>
                        </div>
                    ))}
                    <h4 className="text-2xl">
                        Total: $
                        {cart
                            .filter((item) => item.price)
                            .reduce((acc, item) => acc + (item.price as number), 0)
                            .toFixed(2)}
                    </h4>
                    <Link to="/checkout" className="checkout-button !text-2xl">
                        Checkout
                    </Link>
                </div>
            ) : (
                <h4 id="empty-cart">Your cart is empty</h4>
            )}
        </SwipeableDrawer>
    );
}
