import { useState } from "react";
import { FaMusic, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu mới
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Bước 1: Gửi OTP về email
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError("Vui lòng nhập email"); return; }
        setLoading(true);
        setError("");
        try {
            await authAPI.forgotPassword(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message ?? "Không thể gửi OTP");
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Đặt lại mật khẩu
    const handleReset = async (e) => {
        e.preventDefault();
        if (!otp.trim()) { setError("Vui lòng nhập mã OTP"); return; }
        if (!newPassword || newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
        if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
        setLoading(true);
        setError("");
        try {
            await authAPI.resetPassword(email, otp, newPassword);
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message ?? "Đặt lại mật khẩu thất bại");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full text-[15px] px-4 py-4 border-[1.5px] border-[#2e3450] rounded-[10px] bg-[#232840] text-white outline-none transition-colors duration-200 box-border focus:border-[#7c83f5]";

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#0f1120] [background-image:radial-gradient(ellipse_at_60%_40%,#1e2247_0%,#0f1120_70%)]">
            <div className="bg-[#1a1f35] border border-[#2e3450] rounded-2xl px-12 py-10 w-full max-w-[420px] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-7">
                    <FaMusic size={28} color="#7c83f5"/>
                    <span className="text-xl font-bold text-white tracking-[0.5px]">Sound Wave</span>
                </div>

                {step === 1 ? (
                    <>
                        <h2 className="text-2xl font-bold text-white m-0 mb-1.5">Quên mật khẩu</h2>
                        <p className="text-sm text-[#9ca3af] m-0 mb-7">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
                        <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                            <div className="field relative">
                                <input type="email" placeholder=" " value={email}
                                    onChange={e => { setEmail(e.target.value); setError(""); }}
                                    className={inputCls}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none bg-[#232840] px-1">Email</label>
                            </div>

                            {error && <p className="text-[13px] text-[#f87171] -mt-2 ml-0.5">{error}</p>}

                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 bg-[#7c83f5] text-white text-[15px] font-semibold border-none rounded-[10px] cursor-pointer transition-all duration-200 hover:bg-[#6670e8] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Đang gửi..." : "Gửi mã OTP"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white m-0 mb-1.5">Đặt lại mật khẩu</h2>
                        <p className="text-sm text-[#9ca3af] m-0 mb-7">
                            Mã OTP đã gửi tới <span className="text-white font-medium">{email}</span>
                        </p>
                        <form onSubmit={handleReset} className="flex flex-col gap-5">
                            {/* OTP */}
                            <div className="field relative">
                                <input type="text" placeholder=" " value={otp} maxLength={6}
                                    onChange={e => { setOtp(e.target.value); setError(""); }}
                                    className={inputCls + " tracking-[0.3em] text-center"}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none bg-[#232840] px-1">Mã OTP (6 số)</label>
                            </div>

                            {/* Mật khẩu mới */}
                            <div className="field relative">
                                <input type={showNew ? "text" : "password"} placeholder=" " value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setError(""); }}
                                    className={inputCls + " pr-11"}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none bg-[#232840] px-1">Mật khẩu mới</label>
                                <button type="button" onClick={() => setShowNew(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#6b7280] cursor-pointer p-1 hover:text-[#9ca3af]"
                                >
                                    {showNew ? <FaEyeSlash size={16}/> : <FaEye size={16}/>}
                                </button>
                            </div>

                            {/* Xác nhận mật khẩu */}
                            <div className="field relative">
                                <input type={showConfirm ? "text" : "password"} placeholder=" " value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                                    className={inputCls + " pr-11"}
                                />
                                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none bg-[#232840] px-1">Xác nhận mật khẩu</label>
                                <button type="button" onClick={() => setShowConfirm(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[#6b7280] cursor-pointer p-1 hover:text-[#9ca3af]"
                                >
                                    {showConfirm ? <FaEyeSlash size={16}/> : <FaEye size={16}/>}
                                </button>
                            </div>

                            {error && <p className="text-[13px] text-[#f87171] -mt-2 ml-0.5">{error}</p>}

                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 bg-[#7c83f5] text-white text-[15px] font-semibold border-none rounded-[10px] cursor-pointer transition-all duration-200 hover:bg-[#6670e8] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                            </button>
                        </form>

                        <p className="text-center text-[13px] text-[#6b7280] mt-5 mb-0">
                            <button onClick={() => { setStep(1); setError(""); setOtp(""); }}
                                className="text-[#7c83f5] font-semibold bg-transparent border-none cursor-pointer text-[13px] hover:text-[#a5abff]"
                            >
                                ← Gửi lại OTP
                            </button>
                        </p>
                    </>
                )}

                <p className="text-center text-[13px] text-[#6b7280] mt-5 mb-0">
                    <Link to="/login" className="text-[#7c83f5] no-underline font-semibold hover:text-[#a5abff]">
                        ← Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
