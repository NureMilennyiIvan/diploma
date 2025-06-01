"use client"
import {useRouter} from "next/navigation";
import {useEffect} from "react";

const Page = ()=> {
  const router = useRouter();
  useEffect(() => {
    router.replace("/liquidity-pools");
  }, [router]);

  return null;
};
export default Page;
