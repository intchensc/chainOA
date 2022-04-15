import { Button } from './button';
import * as React from 'react';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';
// @ts-ignore
import styles from './sign.css';
import {request} from "../common/request";
import {Notification} from "./notification";
interface item{
    url:string
    id :number
}

const SignPage = (props: item) => {
    const [signImg, setSignImg] = React.useState('');
    const [signTip, setSignTip] = React.useState('请签名');
    const {url,id} = props
    let sigCanvas: any;
    const clearSign = () => {
        sigCanvas.clear();
    };
    const handleSign = () => {
        setSignImg(sigCanvas.toDataURL());
        console.log("url:"+url)
        upSign()
    };

    const upSign = () => {
        request({
            url: `/api/file/share/sign`,
            method: 'POST',
            data:{
                "url":url,
                "id":id,
                "img":signImg
            },
            success: () => {
                Notification.alert('签署成功', 'info');
            }
        })
    };

    return (
        <div className={styles.signContainer}>
            <div className={styles.signContent}>
                <SignatureCanvas
                    penColor="#000"
                    canvasProps={{
                        width: 343,
                        height: 294,
                        className: styles.canvasContainer
                    }}
                    ref={(ref: any) => {
                        sigCanvas = ref;
                    }}
                    onBegin={() => setSignTip('')}
                />
                {signTip && <div className={styles.signTip}>{signTip}</div>}
            </div>
            <div className={styles.buttonContainer}>
                <Button onClick={clearSign} className={styles.clearBtn}>
                    清除
                </Button>
                <Button onClick={handleSign} className={styles.signBtn} >
                    签字确认
                </Button>
            </div>
            {signImg && <img alt="" width={56} height={48} src={signImg} />}
        </div>
    );
};

export default SignPage;